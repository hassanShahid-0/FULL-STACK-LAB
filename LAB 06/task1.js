/*console.log("booking start");

setTimeout(() => {
    console.log("verification complete");
}, 2000);

console.log("end");
//callback function

function greet(name, welcome){
    console.log("hello " +name); //username API

    welcome(); //password
}

function welcomeMessage() {
    console.log("Welcome");
}

greet("hassan", welcomeMessage)


//async
function checkSeat(seatNumber, seatCheckcallback){
    console.log("checking seat " + seatNumber);
    setTimeout(() => {
        console.log("seat verification complete");
        seatCheckcallback("sear " + seatNumber + " is available");
    }, 2000);
}

checkSeat("Hassan", function(message){
    console.log(message);
});*/


//nest callbacks

// console.log("booking start");  

// setTimeout(() => {
//     console.log("Seat verified");

//     setTimeout(() => {
//         console.log("Payment verified");

//         setTimeout(() => {
//             console.log("Ticket booked");

//             setTimeout(() => {
//                 console.log("Ticket sent to email");
//                 setTimeout(() => {
//                     console.log("Ticket sent to mobile");
//                     setTimeout(() => {
//                         console.log("Ticket sent to whatsapp");
//                     }, 2000);
//                 }, 2000);
//             }, 2000);

//         }, 2000);
//     }, 2000);
// }, 2000);

// console.log("end");

//promises
const payment = new Promise((resolve, reject) => {
    let paymentSuccess = true;
    if (paymentSuccess) {
        resolve("Payment successful");
    } else {
        reject(new Error("Payment failed"));
    }
});


payment
    .then((message) => {
        console.log(message);
    })
    .catch((error) => {
        console.error(error.message);
    });


function verifySeat(seatNumber) {
    return new Promise((resolve, reject) => {
        console.log("Checking seat availability");

        setTimeout(() => {
            resolve("Seat A1 is available");
        }, 2000);
    });
}

verifySeat().then((message) => {
    console.log(message);
})
.catch((error) => {
    console.error(error.message);
})


verifySeat(() => {
    processPayment(() => {
        generateTicket(()=>{
            sendTicket(()=>{
                console.log("booking complete..");
            });
        });
    });
});


verifySeatPromise()
    .then(() => processPaymentPromise())
    .then(() => generateTicketPromise())
    .then((message) => {
        console.log(message);
    })
    .catch((error) => {
        console.error(error.message);
    });


    //async/await
    async function bookTicket() {
        await verifySeat();
        await processPayment();
        const message = await generateTicket();
        console.log(message);
    }

    bookTicket();