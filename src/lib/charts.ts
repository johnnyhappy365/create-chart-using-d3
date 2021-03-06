import * as d3 from 'd3'
import moment from 'moment'

enum Colors {
  grey = 'lightgrey',
  primary = '#42b983',
  secondary = '#e96900',
  text = '#212121',
  axis = '#757575'
}

export interface DataItem {
  x: string | number | Date
  y: string | number
}

export interface ChartMargin {
  left: number
  right: number
  top: number
  bottom: number
}

export interface IChartConfig {
  selector: string
  width?: number | 300
  height?: number | 500
  data: DataItem[]
  margin?: ChartMargin
  onClick?: (d: DataItem) => void
}

export interface BarChartConfig extends IChartConfig {
  showMidLine?: boolean
}
export interface LineChartConfig extends IChartConfig {}
export interface ScatterChartConfig extends IChartConfig {}
export interface ColumnChartConfig extends IChartConfig {}

class BaseChart {
  protected config: BarChartConfig
  svg: any
  x: any
  y: any
  xAxis: any
  yAxis: any
  series: any
  seriesLabel: any
  tooltip: any

  protected initSvg() {
    const { selector, width, height } = this.config

    this.svg = d3
      .select(selector)
      .append('div')
      .classed('chart-wrapper', true)
      .style('display', 'inline-block')
      .style('position', 'relative')
      .style('width', '100%')
      .style('padding-bottom', '100%')
      .style('vertical-align', 'top')
      .style('overflow', 'hidden')
      // Container class to make it responsive.
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('display', 'inline-block')
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
    // .style('background-color', Colors.grey)
  }

  protected initGridlines() {
    this.initXGridlines()
  }

  protected initXGridlines(ticks = 5) {
    const { height, margin } = this.config
    const gridX = d3
      .axisBottom(this.x)
      .ticks((ticks = ticks))
      .tickSize(-height + margin.top + margin.bottom)
      .tickFormat(() => '')
    this.svg
      .append('g')
      .call(gridX)
      .classed('grid', true)
      .attr('color', Colors.grey)
      .attr('stroke-width', 0.1)
      .attr('stroke-dasharray', '3,3')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
  }

  protected initYGridlines(ticks = 5) {
    const { width, margin } = this.config
    const gridY = d3
      .axisLeft(this.y)
      .ticks(ticks)
      .tickSize(-width + margin.left + margin.left)
      .tickFormat(() => '')
    this.svg
      .append('g')
      .call(gridY)
      .classed('grid', true)
      .attr('color', Colors.grey)
      .attr('stroke-width', 0.1)
      .attr('stroke-dasharray', '3,3')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  }
}

export class ScatterChart extends BaseChart {
  constructor(config: ScatterChartConfig) {
    super()
    this.config = {
      width: 500,
      height: 300,
      margin: {
        bottom: 20,
        top: 30,
        left: 40,
        right: 20
      },
      showMidLine: true,
      ...config
    }
    this.init()
  }

  init() {
    this.initSvg()
    this.initAxis()
    this.addAxis()
    this.initSeries()
    this.initBrush()
  }

  protected initBrush() {
    const that = this
    const { margin, width, height, data } = this.config
    const brush = d3.brush().extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom]
    ])
    brush
      // .on('start') // brush start event
      .on('brush', function() {
        // const ext: any[] = d3.brushSelection(this)
        // console.log(
        //   'brushing',
        //   ext.map((e: any) => that.x.invert(e))
        // )
      })
      .on('end', function() {
        const ext: any[] = d3.brushSelection(this)
        // console.log('ext', ext)
        let [[x1, y1], [x2, y2]] = ext
        x1 = that.x.invert(x1)
        x2 = that.x.invert(x2)
        y1 = that.y.invert(y1)
        y2 = that.y.invert(y2)
        console.log(x1, y1, x2, y2)
        const filtered = data.filter((d: DataItem) => {
          return x1 <= d.x && d.x <= x2 && y2 <= d.y && d.y <= y1
        })
        console.log('filtered points', filtered.length)
        // console.log(
        //   'brush end',
        //   ext.map((e: any) => that.x.invert(e))
        // )
      })
    this.svg
      .append('g')
      .attr('class', 'brush')
      .call(brush)
  }

  protected initSeries() {
    const { data } = this.config
    this.svg
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .style('fill', Colors.primary)
      .style('opacity', 0.9)
      .attr('r', 3)
      .attr('cx', (d: DataItem) => this.x(d.x))
      .attr('cy', (d: DataItem) => this.y(d.y))
  }

  protected initAxis() {
    const { data, width, height, margin } = this.config
    const xExtent = d3.extent(data.map((d: DataItem) => d.x as number))
    const yExtent = d3.extent(data.map((d: DataItem) => d.y as number))
    this.x = d3
      .scaleLinear()
      .domain([xExtent[0] - xExtent[1] * 0.05, xExtent[1] * 1.05])
      .range([margin.left, width - margin.right])
    this.xAxis = d3.axisBottom(this.x)

    this.y = d3
      .scaleLinear()
      .domain([yExtent[0] - yExtent[1] * 0.05, yExtent[1] * 1.05])
      .range([height - margin.bottom, margin.top])
    this.yAxis = d3.axisLeft(this.y)
  }

  // TODO: double check wether duplicate
  private addAxis() {
    const { height, margin } = this.config
    this.xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(this.xAxis)

    this.xAxis.selectAll('text').attr('fill', Colors.axis)
    this.xAxis.selectAll('path').attr('stroke', Colors.axis)
    this.xAxis.selectAll('line').attr('stroke', Colors.axis)

    this.yAxis = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxis.selectAll('text').attr('fill', Colors.axis)
    this.yAxis.selectAll('path').attr('stroke', Colors.axis)
    this.yAxis.selectAll('line').attr('stroke', Colors.axis)
  }
}

export class StepChart extends BaseChart {
  constructor(config: LineChartConfig) {
    super()
    this.config = {
      width: 500,
      height: 300,
      margin: {
        bottom: 20,
        top: 20,
        left: 20,
        right: 20
      },
      showMidLine: true,
      ...config
    }
    this.init()
  }
  init() {
    this.initSvg()
    this.initAxis()
    this.addAxis()
    this.initSeries()
  }

  initSeries() {
    const { data } = this.config
    const that = this

    const stepData: DataItem[] = []
    data.forEach((d: DataItem, i: number) => {
      stepData.push(d)
      if (i !== data.length - 1) {
        stepData.push({
          x: data[i + 1].x,
          y: d.y
        })
      }
    })

    const line = d3
      .line()
      .x((d: any, i: number) => that.x(d.x))
      .y((d: any, i: number) => that.y(d.y))

    this.series = this.svg
      .append('path')
      .datum(stepData) // 10. Binds data to the line
      .attr('class', 'line') // Assign a class for styling
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', Colors.primary)
      .attr('stroke-width', 3)
  }

  protected initAxis() {
    const { data, width, height, margin } = this.config
    const maxDomainValue = d3.max(data, (d: DataItem) => d.y as number)
    this.x = d3
      .scaleTime()
      .domain([data[0].x as Date, data[data.length - 1].x as Date])
      .range([margin.left, width - margin.right])

    this.xAxis = d3
      .axisBottom(this.x)
      // @ts-ignore
      .tickFormat((d: DataItem) => moment(d).format('M-D'))
      .ticks(d3.timeDay.every(2))

    this.y = d3
      .scaleLinear()
      .domain([0, maxDomainValue])
      .range([height - margin.bottom, margin.top])
    this.yAxis = d3.axisLeft(this.y)
  }

  // TODO: double check wether duplicate
  private addAxis() {
    const { height, margin } = this.config
    this.xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(this.xAxis)

    this.xAxis.selectAll('text').attr('fill', Colors.axis)
    this.xAxis.selectAll('path').attr('stroke', Colors.axis)
    this.xAxis.selectAll('line').attr('stroke', Colors.axis)

    this.yAxis = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxis.selectAll('text').attr('fill', Colors.axis)
    this.yAxis.selectAll('path').attr('stroke', Colors.axis)
    this.yAxis.selectAll('line').attr('stroke', Colors.axis)
  }
}
export class LineChart extends BaseChart {
  constructor(config: LineChartConfig) {
    super()
    this.config = {
      width: 500,
      height: 300,
      margin: {
        bottom: 20,
        top: 20,
        left: 20,
        right: 20
      },
      showMidLine: true,
      ...config
    }
    this.init()
  }

  init() {
    this.initSvg()
    this.initAxis()
    this.addAxis()
    this.initYGridlines(5)
    this.initBrush()
    this.initSeries()
    this.initTooltip()
  }

  protected initBrush() {
    const that = this
    const { margin, width, height } = this.config
    const brushX = d3.brushX().extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom]
    ])
    brushX
      // .on('start') // brush start event
      .on('brush', function() {
        const ext: any[] = d3.brushSelection(this)
        console.log(
          'brushing',
          ext.map((e: any) => that.x.invert(e))
        )
      })
      .on('end', function() {
        const ext: any[] = d3.brushSelection(this)
        console.log(
          'brush end',
          ext.map((e: any) => that.x.invert(e))
        )
      })
    this.svg
      .append('g')
      .attr('class', 'brush')
      .call(brushX)
  }

  initSeries() {
    const { data } = this.config
    const that = this

    const line = d3
      .line()
      .x((d: any, i: number) => that.x(d.x))
      .y((d: any, i: number) => that.y(d.y))
      .curve(d3.curveMonotoneX)

    this.series = this.svg
      .append('path')
      .datum(data) // 10. Binds data to the line
      .attr('class', 'line') // Assign a class for styling
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', Colors.primary)
      .attr('stroke-width', 3)

    const dot = this.svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle') // Uses the enter().append() method
      .attr('class', 'dot') // Assign a class for styling
      .attr('cx', function(d: any) {
        return that.x(moment(d.x).toDate())
      })
      .attr('cy', function(d: any) {
        return that.y(d.y)
      })
      .attr('r', 5)
      .attr('fill', Colors.primary)
      .attr('stroke', '#fff')
      .style('cursor', 'pointer')
      .attr('stroke-width', 2)
      .on('mouseover', function(d: DataItem, i: number) {
        console.log('y', that.y(d.y))
        that.tooltip
          .transition()
          .duration(20)
          .style('opacity', 0.9)

        let left = d3.event.pageX + 20
        if (i > data.length / 2) {
          left = d3.event.pageX - 120
        }

        const maxDomainValue = d3.max(data, (d: DataItem) => d.y as number)
        let top = d3.event.pageY - 60
        if (d.y > maxDomainValue * 0.66) {
          top = d3.event.pageY + 20
        }
        that.tooltip
          .html(moment(d.x).format('YYYY-MM-DD') + '<br />' + d.y)
          .style('left', left + 'px')
          .style('top', top + 'px')
          .style('z-index', 1)
      })
      .on('mouseout', function(d: DataItem, i: number) {
        that.tooltip.style('opacity', 0).style('z-index', -1)
      })
  }

  protected initTooltip() {
    const { selector } = this.config
    this.tooltip = d3
      .select(selector)
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border', `2px solid ${Colors.primary}`)
  }

  protected initAxis() {
    const { data, width, height, margin } = this.config
    const maxDomainValue = d3.max(data, (d: DataItem) => d.y as number)
    this.x = d3
      .scaleTime()
      .domain([data[0].x as Date, data[data.length - 1].x as Date])
      .range([margin.left, width - margin.right])

    this.xAxis = d3
      .axisBottom(this.x)
      // @ts-ignore
      .tickFormat((d: DataItem) => moment(d).format('M-D'))
      .ticks(d3.timeDay.every(2))

    this.y = d3
      .scaleLinear()
      .domain([0, maxDomainValue])
      .range([height - margin.bottom, margin.top])
    this.yAxis = d3.axisLeft(this.y)
  }

  // TODO: double check wether duplicate
  private addAxis() {
    const { height, margin } = this.config
    this.xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(this.xAxis)

    this.xAxis.selectAll('text').attr('fill', Colors.axis)
    this.xAxis.selectAll('path').attr('stroke', Colors.axis)
    this.xAxis.selectAll('line').attr('stroke', Colors.axis)

    this.yAxis = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxis.selectAll('text').attr('fill', Colors.axis)
    this.yAxis.selectAll('path').attr('stroke', Colors.axis)
    this.yAxis.selectAll('line').attr('stroke', Colors.axis)
  }
}

export class ColumnChart extends BaseChart {
  constructor(config: ColumnChartConfig) {
    super()
    this.config = {
      width: 500,
      height: 300,
      margin: {
        bottom: 20,
        top: 20,
        left: 20,
        right: 20
      },
      showMidLine: true,
      ...config
    }
    this.init()
  }
  init() {
    this.initSvg()
    this.initAxis()
    this.addAxis()
    this.initSeries()
  }

  protected setSeriesColor(color: Colors) {
    this.series
      .transition()
      .duration(200)
      .attr('fill', color)
  }

  protected initSeries() {
    const { data, margin, height, width } = this.config
    const that = this
    const padding: number = 0.3
    const bandwidth: number =
      ((width - margin.left - margin.right) / data.length) * (1 - padding)
    this.series = this.svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('bar', true)
      .attr('fill', Colors.primary)
      .attr('x', (d: DataItem) => this.x(d.x)) // forbiden overlay by series
      .attr('y', (d: DataItem) => height - this.y(d.y))
      .attr('width', bandwidth)
      .attr('height', (d: DataItem) => this.y(d.y) - margin.top)
      .style('cursor', 'pointer')
      .on('mouseover.bar', function(d: DataItem, i: number) {
        that.setSeriesColor(Colors.grey)
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', Colors.primary)
      })
      .on('mouseout.bar', function(d: DataItem, i: number) {
        that.setSeriesColor(Colors.primary)
      })
  }

  protected initAxis() {
    const { data, width, height, margin } = this.config
    const maxDomainValue = d3.max(data, (d: DataItem) => d.y as number)
    this.x = d3
      .scaleTime()
      .domain([data[0].x as Date, data[data.length - 1].x as Date])
      .range([margin.left, width - margin.right])

    this.xAxis = d3
      .axisBottom(this.x)
      // @ts-ignore
      .tickFormat((d: DataItem) => moment(d).format('M-D'))
      .ticks(d3.timeDay.every(2))

    this.y = d3
      .scaleLinear()
      .domain([0, maxDomainValue])
      .range([height - margin.bottom, margin.top])
    this.yAxis = d3.axisLeft(this.y)
  }

  // TODO: double check wether duplicate
  private addAxis() {
    const { height, margin } = this.config
    this.xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(this.xAxis)

    this.xAxis.selectAll('text').attr('fill', Colors.axis)
    this.xAxis.selectAll('path').attr('stroke', Colors.axis)
    this.xAxis.selectAll('line').attr('stroke', Colors.axis)

    this.yAxis = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxis.selectAll('text').attr('fill', Colors.axis)
    this.yAxis.selectAll('path').attr('stroke', Colors.axis)
    this.yAxis.selectAll('line').attr('stroke', Colors.axis)
  }
}

export class BarChart extends BaseChart {
  constructor(config: BarChartConfig) {
    super()
    this.config = {
      width: 500,
      height: 300,
      margin: {
        bottom: 20,
        top: 20,
        left: 160,
        right: 20
      },
      showMidLine: true,
      ...config
    }
    this.init()
  }

  init() {
    this.initSvg()
    this.initAxis()
    this.initGridlines()
    this.addAxis()
    this.initSeries()
    if (this.config.showMidLine) {
      this.initMidLine()
    }
  }

  protected initMidLine() {
    const { data, margin, height } = this.config
    const midValue = d3.median(data.map((d: DataItem) => d.x as number))

    this.svg
      .append('line')
      .classed('mid', true)
      .attr('stroke', Colors.secondary)
      .attr('stroke-width', 2)
      .attr('x1', this.x(midValue))
      .attr('x2', this.x(midValue))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)

    // add text
    this.svg
      .append('text')
      .classed('mid-text', true)
      .attr('x', this.x(midValue) + 2)
      .attr('y', margin.top)
      .attr('width', 20)
      .attr('height', 10)
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .style('fill', Colors.secondary)
      .text(`mid: ${midValue}`)
  }

  protected initSeries() {
    const { data, margin, onClick } = this.config
    const that = this
    this.series = this.svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('bar', true)
      .attr('fill', Colors.primary)
      .attr('x', margin.left + 1) // forbiden overlay by series
      .attr('y', (d: DataItem) => this.y(d.y))
      .attr('width', (d: DataItem) => this.x(d.x) - margin.left)
      .attr('height', this.y.bandwidth())
      .style('cursor', 'pointer')
      .on('click', (d: DataItem) => {
        if (onClick) {
          onClick(d)
        }
      })
      .on('mouseover.bar', function(d: DataItem, i: number) {
        that.setSeriesColor(Colors.grey)
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', Colors.primary)

        that.seriesLabel
          .filter((d: DataItem, index: number) => index === i)
          .transition()
          .duration(200)
          .attr('opacity', 0.9)
      })
      .on('mouseout.bar', function(d: DataItem, i: number) {
        that.setSeriesColor(Colors.primary)
        that.seriesLabel
          .transition()
          .duration(200)
          .attr('opacity', 0)
      })

    this.seriesLabel = this.svg
      .selectAll('.series-label')
      .data(data)
      .enter()
      .append('text')
      .classed('series-label', true)
      .text((d: DataItem) => d.x)
      .attr('fill', Colors.text)
      .attr('x', (d: DataItem) => this.x(d.x) + 4) // forbiden overlay by series
      .attr('y', (d: DataItem) => this.y(d.y) + this.y.bandwidth() / 2)
      .attr('width', (d: DataItem) => this.x(d.x) - margin.left)
      .attr('dominant-baseline', 'central')
      .attr('height', this.y.bandwidth())
      .attr('font-size', '8px')
      .attr('font-family', 'sans-serif')
      .attr('opacity', 0)
  }

  protected setSeriesColor(color: Colors) {
    this.series
      .transition()
      .duration(200)
      .attr('fill', color)
  }

  protected initAxis() {
    const { data, width, height, margin } = this.config
    const maxDomainValue = d3.max(data, (d: DataItem) => d.x as number)
    this.x = d3
      .scaleLinear()
      .domain([0, maxDomainValue])
      .range([margin.left, width - margin.right])

    this.xAxis = d3.axisBottom(this.x)

    this.y = d3
      .scaleBand()
      .domain(data.map((d: DataItem) => d.y) as string[])
      .range([margin.top, height - margin.bottom])
      .padding(0.3)

    this.yAxis = d3.axisLeft(this.y)
  }

  private addAxis() {
    const { height, margin } = this.config
    this.xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(this.xAxis)

    this.xAxis.selectAll('text').attr('fill', Colors.axis)
    this.xAxis.selectAll('path').attr('stroke', Colors.axis)
    this.xAxis.selectAll('line').attr('stroke', Colors.axis)

    this.yAxis = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxis.selectAll('text').attr('fill', Colors.axis)
    this.yAxis.selectAll('path').attr('stroke', Colors.axis)
    this.yAxis.selectAll('line').attr('stroke', Colors.axis)
  }
}
