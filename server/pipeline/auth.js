// If APP_PASSWORD isn't set (e.g. local dev), the app is open — that's fine,
// it's only reachable on your own machine. Once deployed with APP_PASSWORD
// set, every API call must carry a matching x-app-password header.
export function checkPassword(providedPassword) {
  const required = process.env.APP_PASSWORD;
  if (!required) return true;
  return providedPassword === required;
}
