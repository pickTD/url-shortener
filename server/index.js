import express from 'express'
import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import omit from 'lodash/omit'
import defaultTokenList from './constants/tokens'
import trustwalletTokenList from './constants/trustwallet-eth-tokenlist'
import simpleAbi from './abi/simpleAbi'
import { getAddressTokens } from './utils/getAddressTokens'

const app = express()
const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)
const ethcallProvider = new Provider(provider)

const defaultTokensAddresses = defaultTokenList.slice(1).map(token => token.address.toLowerCase())
const defaultTokensWithContracts = defaultTokenList.slice(1).map(token => ({
  ...token,
  contract: new Contract(token.address, simpleAbi),
}))
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

const getNonDefaultTokens = async address => {
  const addresses = await getAddressTokens(address, provider)
  const nonDefaultTokensAddresses = addresses.filter(address => !defaultTokensAddresses.includes(address.toLowerCase()))
    // .filter(address => Boolean(trustwalletTokens[address]))

  return await Promise.all(nonDefaultTokensAddresses.map(async address => {
    const contract = new Contract(address, simpleAbi)

    if (trustwalletTokens[address]) {
      return {
        ...trustwalletTokens[address],
        contract,
      }
    } else {
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

    const nonDefaultTokens = await getNonDefaultTokens(address)
    const addressTokens = [
      ...defaultTokensWithContracts,
      ...nonDefaultTokens,
    ]

    const calls = [
      ethcallProvider.getEthBalance(address),
      ...addressTokens.map(token => token.contract.balanceOf(address)),
    ]

    const balances = await ethcallProvider.all(calls)

    const tokensWithBalances = [...defaultTokenList, ...nonDefaultTokens].map((token, idx) => ({
      ...omit(token, 'contract'),
      balance: ethers.utils.formatUnits(balances[idx], token.decimals)
    }))

    res.json({ balances: tokensWithBalances })
  } catch (e) {
    res.status(500).json(e)
  }
})

export default app