import express from 'express'
import { ethers } from 'ethers'
import { Contract, Provider } from 'ethers-multicall'

const app = express()

const provider = ethers.getDefaultProvider()

const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const shortAbi = ['function balanceOf(address) view returns (uint)']

const erc20Tokens = {
  USDC: { contract: new Contract(usdcAddress, shortAbi), decimals: 6 },
  DAI: { contract: new Contract(daiAddress, shortAbi), decimals: 18 },
  USDT: { contract: new Contract(usdtAddress, shortAbi), decimals: 6 },
}

app.get("/balance", async (req, res) => {
  try {
    const { address } = req.query

    const ethcallProvider = new Provider(provider)
    await ethcallProvider.init()

    const calls = [ethcallProvider.getEthBalance(address)]
    Object.values(erc20Tokens).forEach(token => {
      calls.push(token.contract.balanceOf(address))
    })

    const [ETH, USDC, DAI, USDT] = await ethcallProvider.all(calls)
    const balances = {
      ETH: ethers.utils.formatEther(ETH),
      USDC: ethers.utils.formatUnits(USDC, erc20Tokens.USDC.decimals),
      DAI: ethers.utils.formatUnits(DAI, erc20Tokens.DAI.decimals),
      USDT: ethers.utils.formatUnits(USDT, erc20Tokens.USDT.decimals),
    }

    res.json({ balances })
  } catch (e) {
    res.status(500).json(e)
  }
})

export default app