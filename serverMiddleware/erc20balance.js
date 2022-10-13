import express from 'express'
import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import omit from 'lodash/omit'
import tokenList from './constants/tokens'
import trustwalletTokenList from './constants/trustwallet-eth-tokenlist'

const app = express()

const trustwalletTokens = trustwalletTokenList.reduce((acc, token) => {
  const { symbol, name, address, decimals, logoURI } = token
  return {
    ...acc,
    [address]: {
      key: symbol.toLowerCase(),
      type: 'token',
      symbol,
      name,
      address,
      decimals,
      logoURI,
    }
  }
}, {})

// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)
const shortAbi = [
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
  'function balanceOf(address _owner) public view returns (uint256 balance)'
]
const ethcallProvider = new Provider(provider)

const tokens = tokenList.slice(1).map(token => ({
  ...token,
  contract: new Contract(token.address, shortAbi),
}))

const retry = (fn, address, fromBlock, retries = 5, err = null) => {
  if (retries === 0 || fromBlock === 0) {
    return Promise.reject(err)
  }

  return fn(address, fromBlock)
    .catch(err => {
      return retry(fn, address, Math.round(fromBlock / 10), retries - 1, err)
    })
}

const getLogs = (address, fromBlock) => {
  const filter = {
    address: null,
    fromBlock,
    topics: [
      ethers.utils.id("Transfer(address,address,uint256)"),
      null,
      ethers.utils.hexZeroPad(address, 32)
    ]
  }

  return provider.getLogs(filter)
}

const getOtherTokens = async address => {
  const currentBlock = await provider.getBlockNumber()
  const fromBlock = -currentBlock

  const logs = await retry(getLogs, address, fromBlock)
  
  const defaultTokens = tokenList.map(token => token.address)
  const addresses = logs
    .map(entry => entry.address)
    .filter(address => !defaultTokens.includes(address))
  const addressesFiltered = [...new Set(addresses)]
    // .filter(address => Boolean(trustwalletTokens[address]))

  return await Promise.all(addressesFiltered.map(async address => {
    if (trustwalletTokens[address]) {
      return {
        ...trustwalletTokens[address],
        contract: new Contract(address, shortAbi)
      }
    } else {
      const contract = new Contract(address, shortAbi)
      const calls = [contract.name(), contract.symbol(), contract.decimals()]
      const [name, symbol, decimals] = await ethcallProvider.all(calls)
      return {
        key: symbol.toLowerCase(),
        type: 'token',
        symbol,
        name,
        address,
        decimals,
        contract,
      }
    }
  }))
}

app.get("/balance", async (req, res) => {
  try {
    const { address } = req.query

    await ethcallProvider.init()

    const otherTokens = await getOtherTokens(address)
    const addressTokens = [
      ...tokens,
      ...otherTokens,
    ]

    const calls = [
      ethcallProvider.getEthBalance(address),
      ...addressTokens.map(token => token.contract.balanceOf(address)),
    ]

    const balances = await ethcallProvider.all(calls)

    const tokensWithBalances = [...tokenList, ...otherTokens].map((token, idx) => ({
      ...omit(token, 'contract'),
      balance: ethers.utils.formatUnits(balances[idx], token.decimals)
    }))

    res.json({ balances: tokensWithBalances })
  } catch (e) {
    res.status(500).json(e)
  }
})

export default app