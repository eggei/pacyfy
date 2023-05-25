const { expect, ...oclif } = require("@oclif/test");

describe("start", () => {
  oclif.test
    .stdout()
    .command(["start"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  oclif.test
    .stdout()
    .command(["start", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
