import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});
