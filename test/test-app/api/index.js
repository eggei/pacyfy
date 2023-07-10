const Fastify = require("fastify");
const fastify = Fastify({ logger: true });

// Declare a route
fastify.get("/", async function handler(request, reply) {
  return "Hello from Pacify!";
});

async function runServer() {
  try {
    await fastify.listen({ port: 4000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

runServer();
