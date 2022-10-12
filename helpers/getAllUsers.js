const supabase = require("../supabase");

const getAllUsers = async () => {
  try {
    let { data, error } = await supabase.from("users").select("address");
    return data;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getAllUsers };
