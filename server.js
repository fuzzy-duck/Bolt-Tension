import Express from 'express'

export const startServer = () => {

    const app = Express()
    const port = 3000

    // serve all the files in the root directory as static elements
    app.use(Express.static('./'))

    
    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.get('/serial/', (req, res) => {
        res.send('Serial Comms API')
    })

    // example: http://localhost:3000/serial/alistair/?data=data
    app.get('/serial/:name', function(req, res, next){
        
        // you can pass data into it
        var name = req.params.name;
        
        if (name) res.send(name);
        else next();
    });
    

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })    
}
