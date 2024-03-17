const result = await Bun.build({
    entrypoints: ["./main.js"],
    outdir: "./dist",
    minify: {
        whitespace: true,
        syntax: true,
    },
});

if (!result.success) {
    console.error("Build failed");
    for (const message of result.logs) {
        // Bun will pretty print the message object
        console.error(message);
    }
}