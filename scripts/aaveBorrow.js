const { getWeth } = require("../scripts/getWeth")
const { getNamedAccounts } = require("hardhat")

async function main() {
	await getWeth()
	const { deployer } = await getNamedAccounts()
	const lendingPool = await getLendingPool(deployer)
	console.log(`Lending pool address: ${lendingPool.address}`)

	// Depositing collateral
	const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
	await approveErc20(wethTokenAddress, lendingPool.address, ethers.constants.MaxUint256, deployer)
	console.log("Depositing...")
	const tx = await lendingPool.deposit(
		wethTokenAddress,
		ethers.utils.parseEther("0.01"),
		deployer,
		0
	)
	await tx.wait(1)

	// Borrowing DAI
	// how much we have borrowed, how much we have in collateral, how much we can borrow
	let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
	const daiPrice = await getDaiPrice()
	const amountDaiToBorrow = availableBorrowsETH.toNumber() * 0.95 * (1 / daiPrice.toNumber())
	console.log(`Borrowing ${amountDaiToBorrow} DAI`)
	const daiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
	const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
	await borrowDai(daiTokenAddress, lendingPool, daiToBorrowWei, deployer)
	await getBorrowUserData(lendingPool, deployer)
	await repay(daiToBorrowWei, daiTokenAddress, lendingPool, deployer)
	// there's still some debt left, because we have to pay interest
	// We can use Uniswap to swap WETH for DAI and repay the debt
}

async function repay(amount, daiAddress, lendingPool, account) {
	await approveErc20(daiAddress, lendingPool.address, amount, account)
	const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
	await repayTx.wait(1)
	console.log("Repayed!")
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
	const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account)
	await borrowTx.wait(1)
	console.log("Borrowed!")
}

async function getDaiPrice() {
	const daiPriceFeed = await ethers.getContractAt(
		"AggregatorV3Interface",
		"0x773616E4d11A78F511299002da57A0a94577F1f4"
	)
	const price = await daiPriceFeed.latestRoundData()
	console.log(`Dai price: ${price.answer.toString()}`)
	return price.answer
}

async function getBorrowUserData(lendingPool, account) {
	const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
		await lendingPool.getUserAccountData(account)
	console.log(`Total collateral: ${totalCollateralETH}`)
	console.log(`Total debt: ${totalDebtETH}`)
	console.log(`Available borrow: ${availableBorrowsETH}`)
	return { availableBorrowsETH, totalDebtETH }
}

async function getLendingPool(account) {
	const lendingPoolAddressesProvider = await ethers.getContractAt(
		"ILendingPoolAddressesProvider",
		"0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
		account
	)
	const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
	const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
	return lendingPool
}

async function approveErc20(tokenAddress, spender, amount, account) {
	const token = await ethers.getContractAt("IERC20", tokenAddress, account)
	const tx = await token.approve(spender, amount)
	await tx.wait(1)
	console.log("Approved!")
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
