/*eslint-disable no-unused-vars*/
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {throttle, findIndex}  from 'lodash-es'
import classnames from 'classnames'
import styles  from './style.module.css'

// all interfaces  
export interface AxisItem {
    value: string | number;
    label?: React.ReactNode;
}

export interface MouseData {
    clientX: number | null;
    clientY: number | null;
    svgX: number | null;
    svgY: number | null;
    seriesX: number | null;
    seriesY: number | null;
}

export interface CoordinatedAxisItem extends AxisItem {
    svgCoordinate: number
}

export interface AxisItemInterface {
    svgCoordinate: number;
    label: string;
    value: string | number
}

interface MouseDataType {
    clientX: number | null;
    clientY: number | null;
    svgX: number | null;
    svgY: number | null;
    seriesX: number | null;
    seriesY: number | null;
}

interface Coordinates {
    x: number | null
    y: number | null
}

// all type
export type ChartGetCoordinates = (
    xValue?: string | number | null,
    yValue?: string | number | null,
) => { 
    x: number
    y: number
}

type GetValueType = (x: number, y: number) => Coordinates

// chart 组件基本API
type PropsChartComponent = {
    /**  */
    xAxis: Array<AxisItem>;
    yAxis: Array<AxisItem>;
    xLabelsBetween?: boolean;
    yLabelsBetween?: boolean;
    yLabelsOnRight?: boolean;
    hiddenXGridLines?: boolean;
    hiddenYGridLines?: boolean;
    labelClassName?: string;
    margin?: Array<number>;
    height: number;
    width: number;
    onMouseMove?: React.MouseEventHandler;
    renderChartElements?: (
        getCoordinates: ChartGetCoordinates,
        mouseData: MouseData, // MouseData 与 MouseDataType一样，后期是否能够合并？
        maxY: number,
        getValues: GetValueType,
    ) => React.ReactNode;
    renderXGridLine?: (
        xAxisItem: CoordinatedAxisItem,
        i: number,
        lineYStart: number,
        lineYEnd: number,
        gridLineStyles: string,
    ) => React.ReactNode;
    renderYGridLine?: (
        yAxisItem: CoordinatedAxisItem,
        i: number,
        lineXStart: number,
        lineXEnd: number,
        gridLineStyles: string,
    ) => React.ReactNode;
    renderXLabel?: (
        xAxisItem: CoordinatedAxisItem,
        i: number
    ) => React.ReactNode;
    renderYLabel?: (
        yAxisItem: CoordinatedAxisItem,
        i: number
    ) => React.ReactNode;
}
type ChartState = {
    mouseData: MouseDataType;
}

const SPACER_ITEM = {label: 'ghost', value: 'spacer'}

function getCoordinate (value: string | number, axisItems: any[], axisLength: number, offset: number,  labelsBetween = false){
    
    if(typeof value === 'string'){
        const index = findIndex(axisItems, (item=>{ return item.value === value}))
        if(index === -1) return false
        const ratio = index / (axisItems.length - 1)
        const lineCoordinate = ratio * axisLength + offset
        return labelsBetween ? lineCoordinate + (0.5 * axisLength) / (axisItems.length - 1) : lineCoordinate
    }else{
        const start = axisItems[0].value
        const end = axisItems[axisItems.length -1].value
        const ratio = (value - start) / (end - start)
        return ratio * axisLength + offset
    }
}

function getSvgCoordinates (axisItems: any[], axisLength: number, offset: number){
    return axisItems.map((axisItem: any) =>({
        ...axisItem,
        svgCoordinate: getCoordinate(axisItem.value, axisItems, axisLength, offset, false)
    }))
}

function getValue (coordinates: number, axisItems: string | any[], axisLength: number, offset: number, labelsBetween: boolean) {
    const start = axisItems[0].value
    const end = axisItems[axisItems.length-1].value

    if(typeof start === 'string'){
        const pixelsPerValue = axisLength / axisItems.length
        const columnIndex = Math.floor((coordinates-offset)/ pixelsPerValue)
        const itemIndex = labelsBetween ? columnIndex - 1 : columnIndex
        const candidate = axisItems[itemIndex]
        return !candidate || candidate === SPACER_ITEM ? null : candidate
    }else{
        const value = ((coordinates-offset) * (end - start)) / axisLength * start
        return isBetween(start, value, end) ? value : null
    }
}

function isBetween(a: number,b: number,c: number){
    return (b>=a && b<=c) || (b <= a && b >=c)
}

function isInvalidLabel(n: any){
    return !(typeof n === 'number' || typeof n === 'string')
}

class Chart extends Component<PropsChartComponent, ChartState> {
    throttledMouseUpdate: (clinetX: number, clientY: number) => void
    svg: any;
    topMargin: number;
    rightMargin: number;
    bottomMargin: number;
    leftMargin: number;
    getValues: GetValueType;
    getCoordinates: (x: number, y: number) => Coordinates;
    xCoordinates: Array<AxisItemInterface> /** x坐标轴 */
    yCoordinates: Array<AxisItemInterface> /** y坐标轴 */

    constructor (props: PropsChartComponent){
        super(props)
        this.svg = React.createRef<HTMLOrSVGElement>()
        this.setProperties()
        this.state = {
            mouseData: {
                clientX: null,
                clientY: null,
                svgX: null,
                svgY: null,
                seriesX: null,
                seriesY: null
            }
        }

        this.throttledMouseUpdate = throttle((clientX: any, clientY: any)=> {
            console.log({clientX, clientY})
        }, 100)
    }

    // 设置chart属性
    setProperties = () =>{
        const { xAxis, yAxis, xLabelsBetween, yLabelsBetween, margin, width, height } = this.props
        console.log({xLabelsBetween, yLabelsBetween})
        if(!xAxis.length || !yAxis.length) return

        // 设置chart基本margin
        this.topMargin = margin[0]
        this.rightMargin = margin[1]
        this.bottomMargin = margin[2]
        this.leftMargin = margin[3]

        const xAxisItems = typeof xAxis[0].value === 'string' && xLabelsBetween ? [...xAxis, SPACER_ITEM]: xAxis
        const yAxisItems = typeof yAxis[0].value === 'string' && yLabelsBetween ? [...yAxis, SPACER_ITEM] : yAxis
        const xAxisItemLen = width - this.leftMargin - this.rightMargin
        const yAxisItemLen =  height - this.bottomMargin - this.topMargin

        this.xCoordinates = getSvgCoordinates(xAxisItems, xAxisItemLen, this.leftMargin)
        this.yCoordinates = getSvgCoordinates(yAxisItems, yAxisItemLen, this.topMargin)

        this.getCoordinates = (xValue, yValue)=>({
            x: getCoordinate(xValue, xAxisItems, width - xAxisItemLen, this.leftMargin, xLabelsBetween) || 0,
            y: getCoordinate(yValue, yAxisItems, yAxisItemLen, this.topMargin, yLabelsBetween)|| 0,
        })

        this.getValues = (xCoordinate, yCoordinate)=>{
            const x = getValue(xCoordinate, xAxisItems, xAxisItemLen, this.leftMargin, xLabelsBetween)
            const y = getValue(yCoordinate, yAxisItems, yAxisItemLen, this.topMargin, yLabelsBetween)
            return {
                x: x && y ? x :null,
                y: x && y ? y :null
            }
        }

    }

    render () {
        const  {
            xAxis,
            yAxis,
            width,
            height,
            labelClassName,
            xLabelsBetween,
            yLabelsBetween,
            yLabelsOnRight,
            hiddenXGridLines,
            hiddenYGridLines,
            renderChartElements,
            renderXGridLine,
            renderYGridLine,
            renderYLabel,
            renderXLabel
        } = this.props

        this.setProperties()
        const gridLineStyles = classnames(styles.chartElement, styles.gridLine)
        return <svg 
            className={classnames(styles.chart)}
            height={height}
            width={width}
            ref={this.svg}
        >
            <g id="x-grid-lines">
                {this.xCoordinates.map((xAxisItem, i)=>{
                    const lineYStart= this.topMargin
                    const lineYEnd = height - this.bottomMargin
                    return (
                        (!hiddenXGridLines || !i) && (
                            <g 
                                key={i}
                                className={styles.gridLineContainer}
                                style={{transform: `translateX(${xAxisItem.svgCoordinate}px)`}}
                            >
                                {renderXGridLine 
                                    ? renderXGridLine(xAxisItem, i, lineYStart, lineYEnd, gridLineStyles)
                                    : <line 
                                        y1={lineYStart}
                                        y2={lineYEnd}
                                        x1={0}
                                        x2={0}
                                        className={gridLineStyles}
                                    />
                                }
                            </g>
                        )
                    )
                })}
            </g>
            <g id="y-grid-lines">
                {this.yCoordinates.map((yAxisItem,j)=>{
                    const lineXStart = this.leftMargin
                    const lineXEnd = width - this.rightMargin
                    return (
                        (!hiddenXGridLines || j === this.yCoordinates.length - 1) && (
                            <g
                                key={j}
                                className={styles.gridLineContainer} 
                                style={{transform: `translateY(${yAxisItem.svgCoordinate}px)`}}
                            >
                                {renderYGridLine 
                                    ? renderYGridLine(yAxisItem, j , lineXStart, lineXEnd, gridLineStyles)
                                    : <line 
                                        x1={lineXStart} 
                                        x2={lineXEnd} 
                                        y1={0} 
                                        y2={0} 
                                        className={gridLineStyles}
                                    />
                                }
                            </g>
                        )
                        
                    )
                    
                })

                }
            </g>
            <g id="x-labels">
                {
                    this.xCoordinates.map((xAxisItem, i) =>{
                        if(isInvalidLabel(xAxisItem.label))return null
                        
                        let xCoordinate = xAxisItem.svgCoordinate
                        if(xLabelsBetween){
                            const nextItem = this.xCoordinates[i + 1]
                            if(!nextItem)return null
                            xCoordinate = 0.5 * (xAxisItem.svgCoordinate + nextItem.svgCoordinate)
                        }

                        return <g 
                            key={i}
                            className={styles.labelContainer}
                            style={{transform: `translateX(${xCoordinate}px)`}}
                        >
                            <text 
                                key={i}
                                x={0}
                                y={height - this.bottomMargin + 20}
                                className={classnames(
                                    styles.chartElement,
                                    styles.label,
                                    styles[`label-x`],
                                    labelClassName
                                )}
                            >
                                {renderXLabel? renderXLabel(xAxisItem, i): xAxisItem.label}
                            </text>
                        </g>
                    })
                }
            </g>
            <g id="y-labels" style={{transform: yLabelsOnRight ? `translateX(${width - this.rightMargin + 10}px)`: ''}}>
                {
                    this.yCoordinates.map((yAxisItem, i) =>{
                        if(isInvalidLabel(yAxisItem.label))return null
                        
                        let yCoordinate = yAxisItem.svgCoordinate
                        if(yLabelsBetween){
                            const nextItem = this.yCoordinates[i + 1]
                            if(!nextItem)return null
                            yCoordinate = 0.5 * (yAxisItem.svgCoordinate + nextItem.svgCoordinate)
                        }
                        return <g 
                            key={i}
                            className={styles.labelContainer}
                            style={{transform: `translateY(${yCoordinate}px)`}}
                        >
                            <text
                                key={i}
                                x={1}
                                y={0}
                                className={classnames(
                                    styles.chartElement,
                                    styles.label,
                                    styles[`label-y`],
                                    labelClassName
                                )}
                            >
                                {renderYLabel? renderYLabel(yAxisItem, i): yAxisItem.label}
                            </text>
                        </g>
                    })
                }
            </g>
            {renderChartElements && renderChartElements(
                    this.getCoordinates, 
                    this.state.mouseData, 
                    height - this.bottomMargin, 
                    this.getValues)
            }
        </svg>
    }

    static defaultProps: Partial<PropsChartComponent> = {
        xLabelsBetween: false,
        yLabelsBetween: false,
        yLabelsOnRight: false,
        hiddenXGridLines: false,
        hiddenYGridLines: false,
        labelClassName: '',
        margin: [10, 10, 10, 40]
    }

    static propTypes: any = {
        xAxis: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.node
            })
        ).isRequired,
        yAxis: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.node
            })
        ).isRequired,
        xLabelsBetween: PropTypes.bool,
        yLabelsBetween: PropTypes.bool,
        yLabelsOnRight: PropTypes.bool,
        hiddenXGridLines: PropTypes.bool,
        hiddenYGridLines: PropTypes.bool,
        labelClassName: PropTypes.string,
        margin: PropTypes.arrayOf(PropTypes.number),
        height: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        onMouseMove: PropTypes.func,
        renderChartElements: PropTypes.func,
        renderXGridLine: PropTypes.func,
        renderYGridLine: PropTypes.func,
        renderXLabel: PropTypes.func,
        renderYLabel: PropTypes.func
    }
}
export default Chart