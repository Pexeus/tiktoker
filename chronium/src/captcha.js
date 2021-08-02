const buster = require("./buster")

const dedected = []
var isSolving = false

module.exports = {
    dedect: async page => {
        const id = page._tracing._client._sessionId

        if (!dedected.includes(id)) {
            dedected.push(id)

            var captchaPrompted = true
        
            await page.waitForSelector(".captcha_verify_slide--slidebar")
                .catch(err => {
                    captchaPrompted = false
                })

            if (captchaPrompted) {
                isSolving = true

                const sliderElement = await page.$('.captcha_verify_slide--slidebar')
                const slider = await sliderElement.boundingBox()

                const sliderHandle = await page.$(".secsdk-captcha-drag-icon")
                const handle = await sliderHandle.boundingBox()

                await sleep(1000)

                const imageURL = await page.evaluate(() => {
                    const image = document.getElementById("captcha-verify-image")

                    return image.src
                })

                const sliderPercentage = await buster.solve(imageURL)
                const sliderPosX = Math.round((sliderPercentage * 0.01 * slider.width) + (handle.width / 2) - 5)

                await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
                await page.mouse.down()

                await page.mouse.move(handle.x + sliderPosX, handle.y + handle.height / 2, { steps: 10 })
                await page.mouse.up()

                setTimeout(() => {
                    isSolving = false
                }, 3000);
            }
        }
    },
    isBusy: () => {
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (isSolving == false) {
                    clearInterval(checkInterval)
                    resolve()
                }
            }, 1000);
        })
    }
}

function sleep(ms) {
    return new Promise(async resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}