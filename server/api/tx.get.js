import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'
import trustwalletTokens from '../tokenlists/trustwallet'
import simpleAbi from '../abi/contractAbi'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)
const ethcallProvider = new Provider(provider) 
const iface = new ethers.utils.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
])

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

    const details = {
      transactionHash,
      blockNumber,
      confirmations,
      from,
      to,
      transfers,
      status: status === 1 ? 'Success' : 'Failure',
      value: ethers.utils.formatEther(value),
    }

    return { details, raw: { receipt, transaction } }
  } catch (e) {
    sendError(event, createError({ statusMessage: e.reason }))
  }
})