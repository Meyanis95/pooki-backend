const getSubscriptionKey = (expoPushToken) =>
  expoPushToken.split("[")[1].replace(/\]/g, "");

module.exports = { getSubscriptionKey };
