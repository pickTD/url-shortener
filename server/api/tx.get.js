import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import trustwalletTokens from '../tokenlists/trustwallet'
import simpleAbi from '../abi/contractAbi'
import * as aavev2 from '../protocols/aavev2'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)
const ethcallProvider = new Provider(provider) 
const iface = new ethers.utils.Interface(['event Transfer(address indexed from, address indexed to, uint256 amount)'])
const aave2Iface = new ethers.utils.Interface(aavev2.abi)

export default defineEventHandler(async (event) => {
  try {
    const { hash } = getQuery(event)

    await ethcallProvider.init()

    const receipt = await provider.getTransactionReceipt(hash)
    const transaction = await provider.getTransaction(hash)

    const {
      blockNumber,
      confirmations,
      // contractAddress,
      // cumulativeGasUsed,
      // effectiveGasPrice,
      from,
      // gasUsed,
      logs,
      status,
      to,
      transactionHash,
    } = receipt
    const { value } = transaction

    const transfers = await Promise.all(logs
      .filter(entry => entry.topics[0] === ethers.utils.id("Transfer(address,address,uint256)"))
      .map(async ({ address, data, topics }) => {
        const { from, to, amount } = iface.decodeEventLog('Transfer', data, topics)
        
        if (trustwalletTokens[address]) {
          const token = trustwalletTokens[address]
          return {
            token: {
              symbol: token.symbol,
              logoURI: token.logoURI,
            },
            from,
            to,
            amount: ethers.utils.formatUnits(amount, token.decimals)
          }
        } else {
          const contract = new Contract(address, simpleAbi)
          const calls = [contract.symbol(), contract.decimals()]
          const [symbol, decimals] = await ethcallProvider.all(calls)
          return {
            token: { symbol },
            from,
            to,
            amount: ethers.utils.formatUnits(amount, decimals)
          }
        }
      }))

    const aavev2Events = await Promise.all(logs
      .filter(entry => entry.address === aavev2.address)
      .map(async entry => {
        const { name, args: { reserve, amount } } = aave2Iface.parseLog(entry)
        
        const underlyingAsset = {
          symbol: '',
          logoURI: ''
        }
        if (trustwalletTokens[reserve]) {
          const token = trustwalletTokens[reserve]
          underlyingAsset.symbol = token.symbol
          underlyingAsset.logoURI = token.logoURI
          if (amount) {
            underlyingAsset.amount = ethers.utils.formatUnits(amount, token.decimals)
          }
        } else {
          const contract = new Contract(reserve, simpleAbi)
          const calls = [contract.symbol(), contract.decimals()]
          const [symbol, decimals] = await ethcallProvider.all(calls)
          underlyingAsset.symbol = symbol
          if (amount) {
            underlyingAsset.amount = ethers.utils.formatUnits(amount, decimals)
          }
        }

        return { name, underlyingAsset, protocolName: aavev2.name }
      }))

    const details = {
      transactionHash,
      blockNumber,
      confirmations,
      from,
      to,
      transfers,
      aavev2Events,
      status: status === 1 ? 'Success' : 'Failure',
      value: ethers.utils.formatEther(value),
    }

    return { details }
  } catch (e) {
    sendError(event, createError({ statusMessage: e.reason }))
  }
})