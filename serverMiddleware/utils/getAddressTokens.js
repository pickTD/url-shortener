import { ethers } from 'ethers'

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