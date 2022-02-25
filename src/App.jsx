import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  // Just a state variable we use to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");

  const [currentWaveCount, setCurrentWaveCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [currentMessage, setMessage] = useState("");
  const [currentlyMinning, setMinning] = useState([false, ""]);
  
  // Variable to hold contract address after deploy 
  const contractAddress = "0x911c2D38B982D28F920D9C3357776553e13FBd53";  

  // refrencing contract ABI content
  const contractABI = abi.abi;
  
  const checkIfWalletIsConnected = async () => {
    /* First make sure we have access to window.ethereum */

    try{
      const { ethereum } = window;
      if(!ethereum){
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /* Check if we're authorized to access the user's wallet */
      const accounts = await ethereum.request({method: "eth_accounts"});
  
      if(accounts.length != 0){
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch(error) {
      console.log(error);
    }
  }

  // Implementing connect wallet here
  const connectWallet = async() => {
    try{
      const {ethereum} = window;
      
      if(!ethereum){
        alert("Get Metamask 🦊! ");
        return;
      }

      const accounts = await ethereum.request({method:"eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      initializWaveCount();
      getAllWaves();
    } catch(error){
      console.log(error);
    }
  }

  const initializeWaveCount = async () => {
    try{
      const {ethereum} = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setCurrentWaveCount(count.toNumber());
        console.log("initiated with wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(error){
      console.log(error);
    }
  }
  
  const wave = async () => {
    try{
      const { ethereum } = window;

      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        if(currentMessage == ""){
          alert("Please leave a small message, every wave brings a smile on my face 🙂");
          return;
        }
        
        // Executing actual wave from smart-contract
        const waveTxn = await wavePortalContract.wave(currentMessage, { gasLimit: 300000 });
        console.log("Minning...", waveTxn.hash);
        setMinning([true, waveTxn.hash]);
        await waveTxn.wait();
        console.log("mined -- ", waveTxn.hash);
        setMinning([false, ""]);
        
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setCurrentWaveCount(count.toNumber());
        setMessage("");
        getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(error) {
        alert("Faced some error while transacting, try again in a few ;)");
        setMinning([false, ""]);
        setMessage("");
        console.log(error);
    }
  }

  // this is to getAllWaves ever made
  const getAllWaves = async ()=> {
    try{
      const { ethereum } = window;

      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // calling getAllWaves method
        const waves = await wavePortalContract.getAllWaves();

        // need to clean waves
        // we only want: address, timestamp and msg
        let wavesCleaned = [];
        waves.forEach( wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        console.log("Cleaned waves:", wavesCleaned);
        // storing this data in React State
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch(error) {
      console.log(error)
    }
  }

  
  /* This runs our function when the page loads. */
  useEffect(() => {  
    checkIfWalletIsConnected();
    initializeWaveCount();
    // listen for emmited events
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave:", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
      initializeWaveCount();
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if(wavePortalContract){
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        Hello 👋 buddy, Denil here.
        </div>

        <div className="bio">
          I am actively learning blockchain so that's pretty cool right? Connect your Rinkeby Ethereum wallet, leave a small message and then wave 👋!
        </div>

        {currentAccount && (<textarea className="messageBox" value={currentMessage} placeholder="Leave your message here..." maxLength="250" rows="3" cols="50" onChange = {(event) => {setMessage(event.target.value)}} />
        )}
        
        {currentAccount &&(<button className="waveButton" onClick={wave}>
          Wave at Me
        </button>)}

        {/* Render this button if no currentAccount */}
        {!currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              🦊 Connect Metamask wallet (Rinkeby)
            </button>
        )}

        {/* Mining status of txn */}
        {currentlyMinning[0] && (
          <p className="minningStatus"> Minning your transaction... (Please give it a minute) <br/> <a href={`https://rinkeby.etherscan.io/tx/${currentlyMinning[1]}`} target="_blank">View on EtherScan</a> </p>
          
        )}
        
        {currentAccount && (<div className="waveCounter">
          <strong>Total waves: {currentWaveCount}</strong>
        </div>)}
      
        {currentAccount && (allWaves.length!=0) &&(
        <div className="log-heading">Wave Logs 👀</div>
        )}
        
        {currentAccount && (allWaves.map((wave,index) => {
          return (
            <div className="waves" key={index}>
              <div><strong>Address:</strong> {wave.address}</div>
              <div><strong>Time:</strong> {wave.timestamp.toString()}</div>
              <div><strong>Message:</strong> {wave.message}</div>
            </div>
          )  
        }))}
        
      </div>
    </div>
  );
}

export default App