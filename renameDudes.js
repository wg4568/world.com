const fs = require("fs");
const dir = "./static/img/dudes";

fs.readdir(dir, (err, files) => {
    files.forEach((file, idx) => {
        fs.rename(`${dir}/${file}`, `${dir}/dude${idx + 1}.png`, () => {
            console.log(`${file} renamed`);
        });
    });
});
