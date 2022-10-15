const { Expo } = require("expo-server-sdk");

const sendPushNotification = async () => {
  const message = [
    {
      body: "You just received a transaction",
      data: { data: "goes here" },
      title: "You just received a transaction",
      to: "ExponentPushToken[GG2nnTM6Z4n15h90ZHZakf]",
    },
  ];

  const expo = new Expo();
  let ticketChunk = await expo.sendPushNotificationsAsync(message);
  console.log(ticketChunk);
  /* Note that expo.sendPushNotificationsAsync will not send the push notifications
   * to the user immediately but will send the information to Expo notifications
   * service instead, which will later send the notifications to the users */
};

sendPushNotification();
