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
    for (let i = 0; i < otp.length; i++) {
        const selector = `#PHONE_SMS_OTP-${i}`;
        await page.fill(selector, otp[i]);
    }
    await sleep(2000);
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
    const cards: ElementHandle[] = await page.$$('section[data-baseweb="card"]._css-gtxWCh');
    console.log(cards);
    console.log("Everything seems to be working")
    for (const card of cards) {
        console.log("Loop is starting")

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
          console.log("The infomration has been collected");
      
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
                const priceElement = await page.$('p._css-dTqljZ')
                let price = "";
                if (priceElement) {
                    price = await priceElement.innerText();
                    const csvFilePath = path.join(process.cwd(), 'ledger.csv');
                    if (!fs.existsSync(csvFilePath)){
                        fs.writeFileSync(csvFilePath, 'Date,Location,Price\n');
                    }
                    fs.appendFileSync(csvFilePath, `${dateTimeText},${locationText},${price}\n`);
                }
                // Click on the 'View Receipt' button
                const viewReceiptButton = await page.$('button._css-hBHgGw');
                if (viewReceiptButton) {
                    await viewReceiptButton.click();
                    await sleep(2000);
                }
                // Download the PDF
                const downloadLink = await page.$('a._css-iuijBg');
                if (downloadLink){
                    const downloadHref = await downloadLink.getAttribute('href');
                    if (downloadHref) {
                        const receiptBuffer = await page.evaluate((url) => {
                            return fetch(url)
                                .then(response => response.arrayBuffer())
                                .then(arrayBuffer => new Uint8Array(arrayBuffer))
                        }, downloadHref);
                        const dirPath = path.join(process.cwd(), 'receipts');
                        if (!fs.existsSync(dirPath)){
                            fs.mkdirSync(dirPath);
                        }
                        const filePath = path.join(dirPath, `${dateTimeText}_${locationText}.pdf`);
                        fs.writeFileSync(filePath, receiptBuffer);
                    }
                }
                const closeButton = await page.$('button._cssSsjcU');
                if (closeButton){
                    await closeButton.click();
                    await sleep(2000);
                }
                const backtoTripsButton = await page.$('button._css-fzayjn');
                if (backtoTripsButton){
                    await backtoTripsButton.click();
                    await sleep(2000);
                }
                }
            }
        }
      }
    }
    await browser.close();
})();
