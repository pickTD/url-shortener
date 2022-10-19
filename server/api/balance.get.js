import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import omit from 'lodash/omit.js'
import defaultTokenList from '../tokenlists/default'
import trustwalletTokens from '../tokenlists/trustwallet'
import simpleAbi from '../abi/contractAbi'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)
const ethcallProvider = new Provider(provider) 

const defaultTokensAddresses = defaultTokenList.slice(1).map(token => token.address.toLowerCase())
const defaultTokensWithContracts = defaultTokenList.slice(1).map(token => ({
  ...token,
  contract: new Contract(token.address, simpleAbi),
}))

const retry = (fn, address, fromBlock, provider, retries = 5, err = null) => {
  if (retries === 0 || fromBlock === 0) {
    return Promise.reject(err)
  }

  return fn(address, fromBlock, provider)
    .catch(err => {
      return retry(fn, address, Math.round(fromBlock / 10), provider, retries - 1, err)
    })
}

const getLogs = (address, fromBlock, provider) => {
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

export const getAddressTokens = async (address, provider) => {
  const currentBlock = await provider.getBlockNumber()
  const fromBlock = -currentBlock

  const logs = await retry(getLogs, address, fromBlock, provider)
  const addresses = logs.map(entry => entry.address)

  return [...new Set(addresses)]
}

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

export default defineEventHandler(async (event) => {
  try {
    const { address } = getQuery(event)

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
      ...omit(token, ['contract']),
      balance: ethers.utils.formatUnits(balances[idx], token.decimals)
    }))

    return { balances: tokensWithBalances }
  } catch (e) {
    sendError(event, createError({ statusMessage: e.reason }))
  }
})
