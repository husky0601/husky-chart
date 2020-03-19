/*eslint-disable no-unused-vars*/
import React, {useState, useEffect} from 'react';
import {Chart} from 'husky-chart'
import {generateAxis} from './util'

function App () {
    const [xAxis, setXAxis] = useState(generateAxis())
    const [yAxis, setYAxis] = useState(generateAxis().reverse())

    const changeChart = ()=>{
        setXAxis(generateAxis())
        setYAxis(generateAxis().reverse())
    }

    return <div className="app-wrap">
        <Chart 
            width={600} 
            height={400} 
            xAxis={xAxis} 
            yAxis={yAxis}
            yLabelsOnRight
            xLabelsBetween
        />
        <div>
            <br/>
            <br/>
            <button onClick={changeChart}>Change Chart</button>
        </div>
    </div>
}
export default App