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
    .match({ recipient_address: "" });

  console.log(data);
  console.log(error);
};
