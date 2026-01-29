// function calculator(a, b, op){
//     switch(op) {
//         case '+':
//             document.write(a + b);
//             break;
//         case '-': 
//             document.write(a - b);
//             break;
//         case '*':
//             document.write(a * b);
//             break;
//         case '%':
//             document.write(a % b);
//             break;
//         default: 
//             document.write('Invalid operator');
//     } 
// }



// x = findMax(1,123,45,345,2345,10102,10101);

// function findMax(...y){
//     let max = Math.max(...y);
//     return max;
// }

// console.log(x);



function calculate(op, x,y){
    console.log((op == '+') ? (x + y) : (op == '-') ? (x - y) : (op == '*') ? (x * y) : (op == '%') ? (x % y) : 'Invalid operator');
}

calculate('+', 10, 5);