const express = require("express");
const app = express();
const ethers = require("ethers");
const axios = require("axios");
const { getSubscriptionKey } = require("./helpers/getSubscriptionKey");
const { getAllUsers } = require("./helpers/getAllUsers");
const { supabase } = require("./supabase");
//et cron = require("node-cron");
//let shell = require("shelljs");
//const Web3 = require("web3");
// const { ethers } = require('ethers')
// const jwt = require('jsonwebtoken');
// const path = require('path');
// const history = require('history');
// const cookieParser = require("cookie-parser");
const cors = require("cors");
var bodyParser = require("body-parser");

const PORT = process.env.PORT || 8888;

const network = "goerli";
const provider = new ethers.providers.InfuraProvider(
  network,
  process.env.INFURA_ID
);

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.options("*", cors());

const main = async () => {
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
    allStates[addr] = await getState(addr);
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
            if (tx.from === addr || tx.to === addr) {
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

  try {
    let { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("address", address);

    if (data.length > 0) {
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .match({ address: address });
      var id = data[0].id;
      newaccount = false;
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(200).json({ id, newaccount });
      }
    } else {
      let { data, error } = await supabase
        .from("users")
        .insert({ address: address });
      console.log("data", data);
      console.log("error", error);
      newaccount = true;
      var id = data[0].id;
      if (error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(200).json({ id, newaccount });
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

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

main();
