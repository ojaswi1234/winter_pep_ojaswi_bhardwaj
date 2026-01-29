function step1(){
    return Promise.resolve("Step 1 done.....");
}
function step2(){
    return Promise.resolve("Step 2 is also done ..........");
}

step1().then(res => {
    console.log(res);
;
}).then(step2)