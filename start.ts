import { Browser, Page, chromium, ElementHandle } from 'playwright-chromium';
import * as readline from 'readline';
import fs from 'fs';
import path from 'path';

async function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<string>((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const browser: Browser = await chromium.launch({ headless: false });  // Using Webkit (Safari). You can also use 'firefox' or 'chromium'
    const page: Page = await browser.newPage();

    // Navigate to Uber login page
    await page.goto('https://auth.uber.com/v2/?breeze_local_zone=dca24&next_url=https%3A%2F%2Fm.uber.com%2Flogin-redirect%2F%3Fmarketing_vistor_id%3Dc0b51f85-17c2-4d3e-9ad9-aaac66a536b6%26uclick_id%3D1693173e-c62c-473b-a858-2268a2a41d77&state=je3VONawfjOcBO_i1Lf8oFUx5ZIukMlr-_vFZdPN8Vc%3D');
    

    // Input your email and password
    await page.fill('#PHONE_NUMBER_or_EMAIL_ADDRESS', 'jaisehgal11299@gmail.com');
    const loginButton = await page.$('#forward-button');  // Adjust the selector based on the actual one
    if (loginButton) {
        await loginButton.click();
    }
    await sleep(2000);
    const OTP = await askQuestion("Enter an email OTP: ");

    for (let i = 0;i <OTP.length;i++) {
        const inputID = `#EMAIL_OTP_CODE-${i}`;
        const digit = OTP[i];
        await page.fill(inputID,digit);
    }

    await sleep(2000);
    await page.fill("#PHONE_NUMBER", '3477550853')

    await page.click('#forward-button');
    await sleep(2000);
    await page.click('#user-select-yesme');
    await sleep(2000);
    const otp = await askQuestion("Enter your mobile OTP: ");
    const isSmsOtp = await page.$('#PHONE_SMS_OTP-0');
    const isVoiceOtp = await page.$('#PHONE_VOICE_OTP-0');
    const isWhatsAppOtp = await page.$('#PHONE_WHATSAPP_OTP-0');

    let baseSelector = '';

    if (isSmsOtp) {
        baseSelector = `#PHONE_SMS_OTP-`;
    } else if (isVoiceOtp) {
        baseSelector = `#PHONE_VOICE_OTP-`;
    } else if (isWhatsAppOtp) {
        baseSelector = `#PHONE_WHATSAPP_OTP-`;
    } else {
        console.error("No known OTP input found.");
        return;  // Or handle this situation as needed
    }
    // Fill in the OTP
    for (let i = 0; i < otp.length; i++) {
        const selector = `${baseSelector}${i}`;
        await page.fill(selector, otp[i]);
    }
    await sleep(2000);
    const passwordInput = await page.$('PASSWORD');
    if (passwordInput){
        const password = await askQuestion("Enter your password: ");
        await page.fill('#PASSWORD', password);
        await page.click('#forward-button');
        await sleep(2000);
    }
    try {
        // Attempt to click on the button with a 2-second timeout
        await page.click('[data-baseweb="button"][data-buttonkey="smallHeaderRight"]', { timeout: 2000 });
      } catch (error) {
        // If the above action fails within the timeout, hover over the other element
        await page.hover('._css-ewPtBM');
      }

    await sleep(1000);
    await page.click('[data-baseweb="button"][data-buttonkey="https://riders.uber.com/trips"]');
    await sleep(3000);
    let pageSelector: number = 0;
    const spanSelector = "div[data-baseweb='pagination'] > span._css-bucRsj";
    const spanText = await page.innerText(spanSelector);
    const extractedNumber = parseInt(spanText.split(" ")[1], 10);
    console.log("The number of pages are ", extractedNumber);
    while (pageSelector < extractedNumber) {
        const cards: ElementHandle[] = await page.$$('section[data-baseweb="card"]._css-gtxWCh');
        let current: number = 0;
        const length: number = cards.length;
        while (current < length) {
            console.log("Loop is starting")
            const cards: ElementHandle[] = await page.$$('section[data-baseweb="card"]._css-gtxWCh');
            let card = cards[current];
            current++;

            await sleep(2000);

            const dateTimeElement = await card.$('p._css-dTqljZ');
            const locationElement = await card.$('div._css-byJCfZ');
            if (dateTimeElement && locationElement) {
        
            if (dateTimeElement && locationElement) {
                const dateTimeText = await dateTimeElement.innerText();
                const locationText = await locationElement.innerText();
          
                const targetLocation = '15 W 61st St, New York, NY 10023, US';
          
                const dateObj = new Date(dateTimeText);
                const hour = dateObj.getHours(); // This gets the hour (0-23)
                console.log("The information has been collected");
      
                // Check if time is between 1:00 PM and 11:00 AM (i.e., hour is >= 13 or hour is <= 11)
                // and location matches the target location
                if ((hour >= 13 || hour <= 11) && locationText.trim() === targetLocation) {
                    console.log("The hours have been changed");
                    const viewDetailsButton = await card.$('a._css-hBHgGw');
                    if (viewDetailsButton) {
                        console.log("new button has been clicked");
                        await viewDetailsButton.click();
                        await sleep(2000);
                        // fetch the price
                        const details = await page.$$eval('div[data-baseweb="block"]._css-iMyxrY > div._css-cqcWtx > p._css-dTqljZ', nodes => nodes.map(n => (n as HTMLElement).innerText));

                        // Check if we have extracted all 5 expected details
                        const carType = details[0] || "N/A";
                        const distance = details[1] || "N/A";
                        const time = details[2] || "N/A";
                        const price = details[3] || "N/A";
                        const paymentMethod = details[4] || "N/A";

                        console.log(`Car Type: ${carType}`);
                        console.log(`Distance: ${distance}`);
                        console.log(`Time: ${time}`);
                        console.log(`Price: ${price}`);
                        console.log(`Payment Method: ${paymentMethod}`);

                        const csvFilePath = path.join(process.cwd(), 'ledger.csv');

                        if (!fs.existsSync(csvFilePath)) {
                            fs.writeFileSync(csvFilePath, 'Date,Location,Car Type,Distance,Time,Price,Payment Method\n');
                        }

                        fs.appendFileSync(csvFilePath, `${dateTimeText},${locationText},${carType},${distance},${time},${price},${paymentMethod}\n`);

                        // Click on the 'View Receipt' button
                        const viewReceiptButton = await page.$('button._css-hBHgGw');
                        if (viewReceiptButton) {
                            await viewReceiptButton.click();
                            await sleep(2000);
                        }
                        // Download the PDF
                        const downloadLink = await page.$('a._css-iuijBg');
                        if (downloadLink){
                            const [download] = await Promise.all([
                                page.waitForEvent('download'),
                                downloadLink.click()
                            ]);
                            const dirPath = path.join(process.cwd(), 'receipts');
                            if (!fs.existsSync(dirPath)){
                                fs.mkdirSync(dirPath);
                            }
                            const filePath = path.join(dirPath, `${dateTimeText}_${locationText}.pdf`);
                            await download.saveAs(filePath);
                        }
                        console.log("The information has been downloaded successfully");
                        console.log("Coming back to the main page");
                        const closeButton = await page.$('button._css-SsjcU');
                        if (closeButton){
                            console.log("Found the close button");
                            await closeButton.click();
                            await sleep(2000);
                        }
                        console.log("Back to the trips baby");
                        const backtoTripsButton = await page.$('button._css-fzayjn');
                        if (backtoTripsButton){
                            await backtoTripsButton.click();
                            await sleep(2000);
                        }
                        console.log("Loop done");
                        }
                    }
                }
            }
            }
            if (pageSelector === extractedNumber-1){
                break;
            }
            console.log("The page is ",pageSelector, "\n The extracted number is ", extractedNumber);
            const nextButtonSelector = 'button[data-baseweb="button"][aria-label^="next page"]';
            await page.click(nextButtonSelector);
            await sleep(30000);
            pageSelector++;
        }
    await browser.close();
})();
