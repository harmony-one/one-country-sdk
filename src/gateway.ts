import Web3 from 'web3'
import {AbiItem} from 'web3-utils'
import {Contract} from 'web3-eth-contract';
import {HttpProvider} from "web3-core";
import { gatewayABI } from './abi';

export interface GatewayConfig {
  contractAddress: string
  provider?: HttpProvider
  rpcUrl?: string
  privateKey?: string
}

export class Gateway {
  private web3: Web3
  private contract: Contract
  public accountAddress: string

  constructor(config: GatewayConfig) {
    const {
      provider,
      rpcUrl,
      contractAddress,
      privateKey
    } = config

    if(!provider && !rpcUrl) {
      throw new Error('You need to specify rpcUrl or provider')
    }
    this.web3 = new Web3(provider || rpcUrl)

    this.contract = new this.web3.eth.Contract(
      gatewayABI as AbiItem[],
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

  public getPrice(name: string, to: string) {
    return this.contract.methods
      .getPrice(name, to)
      .call()
  }

  public async rent(name: string, url: string, secret: string, to: string) {
    const secretBytes = Web3.utils.keccak256(secret)
    const callObj = { from: this.accountAddress }

    const gasPrice = await this.web3.eth.getGasPrice();
    const gasEstimate = await this.contract.methods.rent(name, url, secretBytes, to).estimateGas(callObj);

    const tx = await this.contract.methods
      .rent(name, url, secretBytes, to)
      .send({ ...callObj, gasPrice: gasPrice, gas: gasEstimate })
    return tx
  }
}
