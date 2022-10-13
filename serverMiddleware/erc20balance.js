import express from 'express'
import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import tokenList from '~/constants/tokens'
import trustwalletTokenList from '~/constants/trustwallet-eth-tokenlist'

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
const shortAbi = ['function balanceOf(address) view returns (uint)']

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
    .filter(address => Boolean(trustwalletTokens[address]))

  return addressesFiltered.map(address => trustwalletTokens[address])
}

app.get("/balance", async (req, res) => {
  try {
    const { address } = req.query

    const otherTokens = await getOtherTokens(address)

    const ethcallProvider = new Provider(provider)
    await ethcallProvider.init()

    const addressTokens = [
      ...tokens,
      ...otherTokens.map(token => ({
        ...token,
        contract: new Contract(token.address, shortAbi),
      }))
    ]

    const calls = [
      ethcallProvider.getEthBalance(address),
      ...addressTokens.map(token => token.contract.balanceOf(address)),
    ]

    const balances = await ethcallProvider.all(calls)

    const tokensWithBalances = [...tokenList, ...otherTokens].map((token, idx) => ({
      ...token,
      balance: ethers.utils.formatUnits(balances[idx], token.decimals)
    }))

    res.json({ balances: tokensWithBalances })
  } catch (e) {
    res.status(500).json(e)
  }
})

export default app