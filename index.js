const express = require("express");
const ethers = require("ethers");
const axios = require("axios");
const { getSubscriptionKey } = require("./helpers/getSubscriptionKey");
const { getAllUsers } = require("./helpers/getAllUsers");
const { createNotif } = require("./helpers/createNotif");
const supabase = require("./supabase");
//et cron = require("node-cron");
//let shell = require("shelljs");
//const Web3 = require("web3");
// const { ethers } = require('ethers')
// const jwt = require('jsonwebtoken');
// const path = require('path');
// const history = require('history');
const { v4 } = require("uuid");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 8888;

const network = "goerli";

const networks_list = ["homestead", "matic", "optimism", "arbitrum", "goerli"];

app.use(cors()).use(cookieParser());

const main = async (network) => {
  const provider = new ethers.providers.InfuraProvider(
    network,
    process.env.INFURA_ID
  );

  const allUsers = await getAllUsers();
  const my_addresses = [];
  allUsers.map((user) => my_addresses.push(user.address));

  function getState(addr) {
    return ethers.utils.resolveProperties({
      balance: provider.getBalance(addr),
      nonce: provider.getTransactionCount(addr),
    });
  }

  const updateLastState = async (addr) => {
    allStates[addr] = await getState(addr);
  };

  let allStates = [];
  my_addresses.map(async (addr) => {
    let state = await getState(addr);
    //console.log("state", state);
    allStates[addr] = state;
  });
  //let lastState = await getState(addr);
  provider.on("block", async (blockNumber) => {
    console.log("current block:", blockNumber);
    try {
      my_addresses.map(async (addr) => {
        const { balance, nonce } = await getState(addr);
        if (
          !balance.eq(allStates[addr].balance) ||
          nonce !== allStates[addr].nonce
        ) {
          //let allTxs = await etherscan_provider.getHistory(my_address);
          let allTxs = await provider.getBlockWithTransactions(blockNumber);
          allTxs.transactions.map((tx) => {
            if (
              tx?.from?.toLowerCase() === addr?.toLowerCase() ||
              tx?.to?.toLowerCase() === addr?.toLowerCase()
            ) {
              console.log("=============== ALERT =================");
              console.log("transaction on address:", addr);
              console.log(tx);
              console.log("=======================================");
              createNotif(tx, addr);
              updateLastState(addr);
              return;
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  });
};

app.get("/login", async (req, res) => {
  const address = req.query.data;
  let newaccount = undefined;
  console.log("address received", address);
  const nonce = v4();

  try {
    let { data, error } = await supabase
      .from("users")
      .select("nonce")
      .eq("address", address);

    if (data.length > 0) {
      let { data, error } = await supabase
        .from("users")
        .update({ nonce })
        .match({ address: address });
      var id = data[0].id;
      newaccount = false;
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(200).json({ id, newaccount, nonce });
      }
    } else {
      let { data, error } = await supabase
        .from("users")
        .insert({ address, nonce });
      console.log("data", data);
      console.log("error", error);
      newaccount = true;
      var id = data[0].id;
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(200).json({ id, newaccount, nonce });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/get_notifications", async (req, res) => {
  const address = req.query.data;
  console.log("address received when get_notifications", address);

  try {
    let { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_address", address);

    if (data) {
      console.log("data received from supabase:", data);
      res.status(200).json({ data });
    } else {
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/store_push_token", async (req, res) => {
  const { pushToken, address } = req.query;

  try {
    let { data, error } = await supabase
      .from("users")
      .update({ push_token: pushToken })
      .match({ address: address });

    if (data) {
      res.status(200).json({ data });
    } else {
      res.status(400).json({ error: error.message });
      console.log(error);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error);
  }
});

app.get("/verify", async (req, res) => {
  try {
    const { address, signature, nonce } = req.query;
    console.log("address received", address);
    console.log("signature received", signature);
    console.log("nonce received", nonce);
    const signerAddr = ethers.utils.verifyMessage(nonce, signature);
    console.log("address resolved", signerAddr);

    if (signerAddr.toLowerCase() !== address.toLowerCase()) {
      throw new Error("wrong_signature");
    }

    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("address", address)
      .eq("nonce", nonce)
      .single();

    const token = jwt.sign(
      {
        aud: "authenticated",
        exp: Math.floor(Date.now() / 1000 + 60 * 60),
        sub: user.id,
        user_metadata: {
          id: user.id,
        },
        role: "authenticated",
      },
      process.env.SUPABASE_JWT
    );

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

main(network);
