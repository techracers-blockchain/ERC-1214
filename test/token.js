const Controller = artifacts.require('./helpers/MockController.sol');
const UpgradeableToken = artifacts.require('./UpgradeableToken.sol');
const Founder = web3.eth.accounts[0];
const Investor = web3.eth.accounts[1];
const assertJump = require("./helpers/assertJump");

contract('Test', (accounts) => {
  let proxy;
  let proxyInstance;
  let controller;

  before(async () => {
    controller = await Controller.new();
    proxyInstance = await UpgradeableToken.new();
    await proxyInstance.setKeyHolder('controller', controller.address);
    proxy = Controller.at(proxyInstance.address);
    await proxy.mint(Founder, 4000000000);
  });

  it('should delegate call to controller to read balance data', async () => {
    assert.equal((await proxy.balanceOf(Founder)).toNumber(), 4000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
    assert.equal(await proxy.checkAddress.call('controller'), controller.address)
    assert.equal(await proxy.checkAddress.call('owner'), accounts[0])
  });

  it('should delegate call to controller and allow transfer', async () => {
    await proxy.transfer(Investor, 2000000000)
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 2000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
    assert.equal(await proxy.checkAddress.call('controller'), controller.address)
    assert.equal(await proxy.checkAddress.call('owner'), accounts[0])
  });

  it('should delegate call to controller and allow approve plus transferFrom', async () => {
    await proxy.approve(Investor, 2000000000);
    assert.equal((await proxy.allowance.call(Founder, Investor)).toNumber(), 2000000000)

    await proxy.transferFrom(Founder, Investor, 2000000000, {from: Investor});
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 4000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 4000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
    assert.equal(await proxy.checkAddress.call('controller'), controller.address)
    assert.equal(await proxy.checkAddress.call('owner'), accounts[0])
  });

  it('should allow to change controller and retain data', async () => {
    await proxy.mint(Founder, 4000000000);
    await proxy.approve(Investor, 2000000000);
    await proxy.transferFrom(Founder, Investor, 2000000000, {from: Investor});

    // change controller and set
    const controllerNew = await Controller.new();
    await proxyInstance.setKeyHolder('controller', controllerNew.address);

    controller = controllerNew;
    assert.equal((await proxy.balanceOf(Investor)).toNumber(), 6000000000);
    assert.equal((await proxy.totalSupply()).toNumber(), 8000000000);
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
    assert.equal(await proxy.checkAddress.call('controller'), controller.address)
    assert.equal(await proxy.checkAddress.call('owner'), accounts[0])
  });

  it('should not allow to set controller by non owner', async () => {
    const controllerNew = await Controller.new();
    try {
      await proxyInstance.setKeyHolder('controller', controllerNew.address, {from: Investor});
      assert.fail("should have failed before")
    } catch(error) {
      assertJump(error);
    }
    assert.equal(await proxyInstance.crate.call('controller'), controller.address)
    assert.equal(await proxyInstance.crate.call('owner'), accounts[0])
    assert.equal(await proxy.checkAddress.call('controller'), controller.address)
    assert.equal(await proxy.checkAddress.call('owner'), accounts[0])
  });
});
