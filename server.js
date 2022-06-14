import Express from 'express'

export const startServer = () => {

    const app = Express()
    const port = 3000

    // serve all the files in the root directory as static elements
    app.use(Express.static('./'))

    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })    
}
