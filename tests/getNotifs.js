const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getNotif = async () => {
  let { data, error } = await supabase
    .from("notifications")
    .select("*")
    .match({ recipient_address: "0xcB7eA0eC36670AA13088C4372fe8636D4D2b574f" });

  console.log(data);
  console.log(error);
};

getNotif();
