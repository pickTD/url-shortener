import express from 'express'
import { ethers } from 'ethers'

const app = express()

const provider = ethers.getDefaultProvider()

const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const shortAbi = ['function balanceOf(address) view returns (uint)']

const allowedTokens = ['ETH', 'USDC', 'DAI', 'USDT']
const erc20Tokens = {
  USDC: { contract: new ethers.Contract(usdcAddress, shortAbi, provider), decimals: 6 },
  DAI: { contract: new ethers.Contract(daiAddress, shortAbi, provider), decimals: 18 },
  USDT: { contract: new ethers.Contract(usdtAddress, shortAbi, provider), decimals: 6 },
}

app.get("/balance", async (req, res) => {
  try {
    const { address, token } = req.query
  
    let value
  
    if (!allowedTokens.includes(token)) {
      res.status(422).json({ reason: 'unsupported token' })
    } else if (token === 'ETH') {
      const balance = await provider.getBalance(address)
      value = ethers.utils.formatEther(balance)
    } else {
      const { contract, decimals } = erc20Tokens[token]
      const balance = await contract.balanceOf(address)
      value = ethers.utils.formatUnits(balance, decimals)
    }

    res.json({ value })
  } catch (e) {
    res.status(500).json(e)
  }
})

export default app