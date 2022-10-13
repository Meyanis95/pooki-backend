const supabase = require("../supabase");
const { ethers } = require("ethers");
const { Expo } = require("expo-server-sdk");

async function getPushToken(addr) {
  let { data, error } = await supabase
    .from("users")
    .select("push_token")
    .eq("address", addr);

  if (data) {
    const { push_token } = data;
    return push_token;
  } else {
    console.log(error);
  }
}

const shortenAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(
    address.length - 4,
    address.length
  )}`;
};

const sendPushNotification = async (content) => {
  const message = [
    {
      body: content,
      data: { data: "goes here" },
      title: "New transaction!!",
      to: "ExponentPushToken[MyTEDmNfbLpl-YmoeoEgnI]",
    },
  ];

  const expo = new Expo();
  let ticketChunk = await expo.sendPushNotificationsAsync(message);
  console.log(ticketChunk);
  return;
  /* Note that expo.sendPushNotificationsAsync will not send the push notifications
   * to the user immediately but will send the information to Expo notifications
   * service instead, which will later send the notifications to the users */
};

createNotif = async (tx, addr) => {
  let type = 2;
  let content;

  if (tx.data === "0x") {
    if (tx?.from?.toLowerCase() === addr.toLowerCase()) {
      content = `You sent ${ethers.utils.formatEther(
        tx.value
      )}ETH to ${shortenAddress(tx.to)}`;
    } else if (tx?.to?.toLowerCase() === addr.toLowerCase()) {
      content = `You received ${ethers.utils.formatEther(
        tx.value
      )}ETH from ${shortenAddress(tx.to)}`;
    } else {
      content = "A transaction just happened!";
    }
  } else {
    content = "A transaction just happened!";
  }

  try {
    //const { pushToken } = await getPushToken(addr);

    let { data, error } = await supabase.from("notifications").insert({
      recipient_address: addr.toLowerCase(),
      content: content,
      type_id: type,
    });

    sendPushNotification(content);

    if (error) return error.message;
    return;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { createNotif };
