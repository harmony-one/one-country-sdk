import Web3 from 'web3'
import {AbiItem} from 'web3-utils'
import {Contract} from 'web3-eth-contract';
import BN from 'bn.js'
import {abi as ContractAbi} from './abi/d1dc.json'
import {NullAddress} from "./constants";
import {HttpProvider} from "web3-core";

export interface OneCountryConfig {
  contractAddress: string
  provider: HttpProvider
  privateKey?: string // for use on server-side
}

export class OneCountry {
  private web3: Web3
  private contract: Contract
  protected accountAddress = ''

  constructor(config: OneCountryConfig) {
    const {provider, contractAddress, privateKey} = config

    this.web3 = new Web3(provider)
    this.contract = new this.web3.eth.Contract(
        ContractAbi as AbiItem[],
        contractAddress
    );

    if(privateKey) {
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      this.web3.eth.accounts.wallet.add(account);
      this.setAccountAddress(account.address)
    }
  }

  public setAccountAddress (address: string) {
    this.accountAddress = address
  }

  public async getPriceByName (name: string): Promise<string> {
    const nameBytes = Web3.utils.keccak256(name)
    return await this.contract.methods
        .getPrice(nameBytes)
        .call()
  }

  public async getRecordByName (name: string) {
    const nameBytes = Web3.utils.keccak256(name)
    const result = await this.contract.methods
        .nameRecords(nameBytes)
        .call()

    const [renter, timeUpdated, lastPrice, url, prev, next] = Object.keys(result).map(k => result[k])

    return {
      renter: renter === NullAddress ? null : renter,
      lastPrice: {
        amount: lastPrice,
        formatted: Web3.utils.fromWei(lastPrice)
      },
      timeUpdated: new BN(timeUpdated).toNumber() * 1000,
      url,
      prev,
      next
    }
  }

  public async rent (name: string, url: string, price: string) {
    const callObj = { value: price, from: this.accountAddress }

    const gasPrice = await this.web3.eth.getGasPrice();
    const gasEstimate = await this.contract.methods.rent(name, url).estimateGas(callObj);

    const tx = await this.contract.methods
        .rent(name, url)
        .send({ ...callObj, gasPrice: gasPrice, gas: gasEstimate })
    return tx
  }

  public async updateURL (name: string, url: string) {
    const callObj = { from: this.accountAddress }

    const gasPrice = await this.web3.eth.getGasPrice();
    const gasEstimate = await this.contract.methods.updateURL(name, url).estimateGas(callObj);

    const tx = await this.contract.methods
        .updateURL(name, url)
        .send({ ...callObj, gasPrice: gasPrice, gas: gasEstimate })
    return tx
  }
}
