const seq = require('bionode-seq')

declare module 'jquery' {
  export = $;
}

interface gRNA {
  x: number;
  label: string;
  seq: string;
  gc: number;
  type: string;
}

interface calculatedSequences {
  forwardsequence: string[];
  reversesequence: string[];
}

interface options {
  strandsShown: string;
  format: string;
  lines: string;
  separator: string;
}

// Display an example
globalThis.showExample = showExample
function showExample (): void {
  $('#fastaSequence').val('ATTAAAGGTTTATACCTTCCCAGGTAACAAACCAACCAACTTTCGATCTCTTGTAGATCTGTTCTCTAAACGAACTTTAAAATCTGTGTGGCTGTCACTCGGCTGCATGCTTAGTGCACTCACGCAGTATAATTAATAACTAATTACTGTCGTTGACAGGACACGAGTAACTCGTCTATCTTCTGCAGGCTGCTTACGGTTTCGTCCGTGTTGCAGCCGATCATCAGCACATCTAGGTTTCGTCCGGGTGTGACCGAAAGGTAAGATGGAGAGCCTTGTCCCTGGTTTCAACGAGAAAACACACGTCCAACTCAGTTTGCCTGTTTTACAGGTTCGCGACGTGCTCGTACGTGGCTTTGGAGACTCCGTGGAGGAGGTCTTATCAGAGGCACGTCAACATCTTAAAGATGGCACTTGTGGCTTAGTAGAAG')
  $('#spacerLength').val(30)
  $('#intervals').val(1)
  $('#forwardPrimer').val('cacc')
  $('#reversePrimer').val('caac')
}

globalThis.clearResults = clearResults
function clearResults (): void {
  $('#errorsDiv').css('display', 'none')
  $('#statsDiv').css('display', 'none')
  $('#outputDiv').css('display', 'none')
  $('#extraOutputDiv').css('display', 'none')

  $('#outputs').removeClass('double')
  $('textarea#errors').val('')
  $('textarea#output').val('')
  $('textarea#extraOutput').val('')
  $('textarea#stats').val('')

  setTimeout(function () {
    updateDisabledOptions()
  }, 50)
}

globalThis.getOptions = getOptions
function getOptions (): options {
  const data: any = $('form').serializeArray()
    .reduce((result, val) => {
      (<any>result)[val.name] = val.value
      return result
    }, {})

  const options: options = {
    strandsShown: data.strandsShown,
    format: data.format,
    lines: data.lines,
    separator: data.separator
  }

  return options
}

globalThis.submitSequence = submitSequence
function submitSequence (): void {
  clearResults()
  $('#outputDiv').css('display', 'block')

  const options: options = getOptions()
  const errors: string[] = []

  // Calculate sequences
  const sequence: string = `${$('#fastaSequence').val()}`.toUpperCase()
  const forwardPrimer: string = `${$('#forwardPrimer').val()}`.toLowerCase()
  const reversePrimer: string = `${$('#reversePrimer').val()}`.toLowerCase()
  let spacerLength: number = parseInt(`${$('#spacerLength').val()}`)
  let intervals: number = parseInt(`${$('#intervals').val()}`)

  let outputs: string[] = []
  let forwardsequence: string[] = []
  let reversesequence: string[] = []
  let pos: number = 0

  if ($('#spacerLength').val() === '') spacerLength = 30
  if ($('#intervals').val() === '') intervals = 1

  if ((!Number.isInteger(intervals) && $('#intervals').val() !== '') || intervals < 1 || parseInt(`${$('#intervals').val()}`) === 0) {
    const message = "Intervals must be an integer 1 or greater, setting 'intervals' to 1."
    errors.push(message)
    intervals = 1
  }

  if ((!Number.isInteger(spacerLength) && $('#spacerLength').val() !== '') || spacerLength < 1 || parseInt(`${$('#spacerLength').val()}`) === 0) {
    const message: string = "Spacer Length must be an integer 1 or greater, setting 'spacerLength' to 1."
    errors.push(message)
    spacerLength = 1
  }

  if (seq.checkType(sequence, 1) === 'dna' || seq.checkType(sequence, 1) === 'rna') {
    // console.log("Sequence is fine, no errors.");
  } else {
    const message: string = 'Input sequence is not DNA or RNA'
    errors.push(message)
  }

  while (pos < sequence.length) {
    if (pos + spacerLength < sequence.length) {
      const match = sequence.slice(pos, pos + spacerLength)
      forwardsequence.push(`${forwardPrimer}${seq.reverse(seq.complement(match))}`)
      reversesequence.push(`${reversePrimer}${match}`)
    }
    pos += intervals
  }

  // Save sequences to #output for charting purposes
  d3.select('#output').datum({
    forwardsequence: forwardsequence,
    reversesequence: reversesequence
  } as calculatedSequences)
  drawChart()

  // Apply options
  const separator: string = options.separator === 'tabs' ? '\t' : ' '

  if (options.format === 'fasta') {
    forwardsequence = forwardsequence.map((d, i) => `>gRNA_${i + 1}_F\n${d.replace(/.{80}/g, '$0\n')}`)
    reversesequence = reversesequence.map((d, i) => `>gRNA_${i + 1}_R\n${d.replace(/.{80}/g, '$0\n')}`)
  } else {
    forwardsequence = forwardsequence.map((d, i) => `gRNA_${i + 1}_F${separator}${d}`)
    reversesequence = reversesequence.map((d, i) => `gRNA_${i + 1}_R${separator}${d}`)
  }

  if (options.lines === 'collate') {
    for (let i = 0; i < forwardsequence.length; i++) {
      outputs.push(forwardsequence[i])
      outputs.push(reversesequence[i])
    }
  } else if (options.lines === 'separate') {
    outputs = forwardsequence.concat(reversesequence)
  } else if (options.lines === 'double') {
    for (let i = 0; i < forwardsequence.length; i++) {
      outputs.push(forwardsequence[i] + separator + reversesequence[i])
    }
  }

  // Print output
  if (options.strandsShown === 'forward') {
    $('#output').val(forwardsequence.join('\n'))
  } else if (options.strandsShown === 'reverse') {
    $('#output').val(reversesequence.join('\n'))
  } else {
    if (options.lines !== 'files') {
      $('#output').val(outputs.join('\n'))
    } else {
      $('#output').val(forwardsequence.join('\n'))
      $('#outputs').addClass('double')
      $('#extraOutputDiv').css('display', 'block')
      $('#extraOutput').val(reversesequence.join('\n'))
    }
  }

  if (spacerLength > sequence.length) {
    errors.push('Warning, spacer length is longer than sequence length.')
  }

  // Print any errors
  if (errors.length > 0) {
    $('#errorsDiv').css('display', 'block')
    $('#errors').val(errors.join('\n'))
  }

  // Print stats
  const stats: string[] = []
  stats.push(`Sequence length: ${sequence.length}`)
  stats.push(`GC content: ${countGCcontent(sequence)}%`)
  if (options.strandsShown === 'both') {
    stats.push(`Number of guide RNAs created: ${forwardsequence.length + reversesequence.length}`)
  } else if (options.strandsShown === 'forward') {
    stats.push(`Number of guide RNAs created: ${forwardsequence.length}`)
  } else if (options.strandsShown === 'reverse') {
    stats.push(`Number of guide RNAs created: ${reversesequence.length}`)
  }

  $('#statsDiv').css('display', 'block')
  $('#stats').val(stats.join('\n'))
}

globalThis.updateData = updateData
function updateData (link: string, data: string): void {
  $(link).prop('href', `data:text/plain;charset=utf-8,${encodeURIComponent(`${$(data).val()}`)}`)
}

globalThis.countGCcontent = countGCcontent
function countGCcontent (sequence: string): number {
  const total: number = sequence.length
  let gc: number = 0
  sequence.split('').forEach(char => {
    if (char === 'c' || char === 'C' || char === 'g' || char === 'G') gc++
  })
  return Math.floor((100 * gc) / total)
}

function updateDisabledOptions (): void {
  const options: options = getOptions()

  if (options.strandsShown === 'both') {
    $("input[name='lines']").prop('disabled', false)

    if (options.format === 'fasta') {
      $('#doubleRadio').prop('disabled', true)

      if ($('#doubleRadio').prop('checked')) {
        $('#collateRadio').prop('checked', true)
      }
    } else {
      $('#doubleRadio').prop('disabled', false)
    }
  } else {
    $("input[name='lines']").prop('disabled', true)
  }

  if (options.format === 'classic') {
    $("input[name='separator']").prop('disabled', false)
  } else {
    $("input[name='separator']").prop('disabled', true)
  }
}

if (window.location.hash === '#advanced') {
  $('#advancedOptions').removeClass('hidden')
}

function drawChart (): void {
  console.log('Drawing chart')

  const rawData: calculatedSequences = d3.select('#output').datum() as calculatedSequences
  let data: gRNA[] = []
  data = data.concat(rawData.forwardsequence.map((d, i) => {
    return {
      x: i,
      label: `gRNA_${i + 1}_F`,
      seq: d,
      gc: countGCcontent(d),
      type: 'forward'
    }
  }))

  data = data.concat(rawData.reversesequence.map((d, i) => {
    return {
      x: i,
      label: `gRNA_${i + 1}_R`,
      seq: d,
      gc: countGCcontent(d),
      type: 'reverse'
    }
  }))

  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 40, left: 50 }
  const width = 900 - margin.left - margin.right
  const height = 600 - margin.top - margin.bottom

  d3.select('#chart g').remove()
  // append the svg object to the body of the page
  const svg = d3.select('#chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform',
      'translate(' + margin.left + ',' + margin.top + ')')

  // Add the grey background that makes ggplot2 famous
  svg
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', height)
    .attr('width', width)
    .style('fill', '#EBEBEB')

  // Add X axis
  const x = d3.scaleLinear()
    .domain([-10, 10 + rawData.forwardsequence.length])
    .range([0, width])
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x).tickSize(-height * 1.3).ticks(10))
    .select('.domain').remove()

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0])
    .nice()
  svg.append('g')
    .call(d3.axisLeft(y).tickSize(-width * 1.3).ticks(7))
    .select('.domain').remove()

  // Customization
  svg.selectAll('.tick line').attr('stroke', 'white')

  // Add X axis label:
  svg.append('text')
    .attr('text-anchor', 'end')
    .attr('x', width / 2 + margin.left)
    .attr('y', height + margin.top + 20)
    .text('gRNA position')

  // Y axis label:
  svg.append('text')
    .attr('text-anchor', 'end')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -margin.top - height / 2 + 20)
    .text('GC content %')

  // Color scale: give me a specie name, I return a color
  const color = d3.scaleOrdinal()
    .domain(['forward', 'reverse', 'average'])
    .range(['#F8766D', '#00BA38', '#619CFF'])

  let tooltip: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null
  let background: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null
  let closeButton: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null
  let title: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null
  let sequence: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null
  let gcContent: d3.Selection<SVGGraphicsElement, {}, HTMLElement, any> = null

  // Add dots
  svg.append('g')
    .selectAll('dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function (d): number { return x(d.x) })
    .attr('cy', function (d): number { return y(d.gc) })
    .attr('r', 4)
    .style('opacity', 0.5)
    .style('fill', function (d: gRNA) { return color(d.type) } as any)
    .on('mouseover', d => {
      tooltip.style('display', 'block')
      title.text(d.label)
      sequence.text(d.seq)
      gcContent.text(`GC: ${d.gc}%`)

      const textWidth: number = sequence.node().getBBox().width
      background.attr('width', textWidth + 20)
      closeButton.attr('x', textWidth + 5)

      let tooltipX: number = x(d.x) + 5
      if (tooltipX + textWidth > width) {
        tooltipX = width - textWidth
      }
      let tooltipY: number = y(d.gc) - 75
      if (tooltipY < 0) {
        tooltipY = y(d.gc) + 5
      }
      tooltip.attr('transform', `translate(${tooltipX}, ${tooltipY})`)
    })

  // Add label
  tooltip = svg.append('g')
    .style('display', 'none')
    .attrs({
      id: 'chart-tooltip'
    })
  background = tooltip.append('rect')
    .attrs({
      width: '370px',
      height: '70px',
      fill: 'white',
      stroke: 'black',
      rx: '5px'
    })
  closeButton = tooltip.append('text').text('X').attrs({
    x: 355,
    y: 18,
    'font-weight': 700
  }).style('cursor', 'pointer')
    .on('click', () => { tooltip.style('display', 'none') })

  title = tooltip.append('text').text('title')
    .attrs({
      x: 10,
      y: 20
    })
  sequence = tooltip.append('text').text('sequence')
    .attrs({
      x: 10,
      y: 40
    })
  gcContent = tooltip.append('text').text('gc Content')
    .attrs({
      x: 10,
      y: 60
    })
}

$('#advancedOptions input').change(() => {
  updateDisabledOptions()
  if ($('#fastaSequence').val() && $('#output').val()) submitSequence()
})

$(document).on('keypress', function (e) {
  // ESCAPE key pressed
  if (e.keyCode === 27) {
    d3.select('#chart-tooltip').style('display', 'none')
  }
})
