export async function getPushToken(addr) {
  let { data, error } = await supabase
    .from("users")
    .select("push_token, subscribed")
    .eq("address", addr);

  const { push_token, subscribed } = data;
  return push_token, subscribed;
}
