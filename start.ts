import { Browser, Page, chromium } from 'playwright-chromium';
import * as readline from 'readline';

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
        const inputID = '#EMAIL_OTP_CODE-${i}';
        const digit = OTP[i];
        await page.fill(inputID,digit);
    }

    await sleep(2000);
    await page.fill("#PHONE_NUMBER", '3477550853')

    await page.click('#forward-button');
    await sleep(2000);
    await page.click('#user-select-yesme');
    await sleep(2000);
    const otp = await askQuestion("Enter an email OTP: ");
    for (let i = 0; i < otp.length; i++) {
        const selector = `#PHONE_SMS_OTP-${i}`;
        await page.fill(selector, otp[i]);
    }
    await sleep(2000);
    const elements = await page.$$('*')
    for (const element of elements){
        const outerHTML = await element.evaluate(el => el.outerHTML);
        console.log(outerHTML)
    }
    
    await browser.close();
})();
