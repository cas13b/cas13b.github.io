var seq = require('bionode-seq');
// Display an example
globalThis.show_example = show_example;
function show_example() {
    $("#fasta_sequence").val('ATTAAAGGTTTATACCTTCCCAGGTAACAAACCAACCAACTTTCGATCTCTTGTAGATCTGTTCTCTAAACGAACTTTAAAATCTGTGTGGCTGTCACTCGGCTGCATGCTTAGTGCACTCACGCAGTATAATTAATAACTAATTACTGTCGTTGACAGGACACGAGTAACTCGTCTATCTTCTGCAGGCTGCTTACGGTTTCGTCCGTGTTGCAGCCGATCATCAGCACATCTAGGTTTCGTCCGGGTGTGACCGAAAGGTAAGATGGAGAGCCTTGTCCCTGGTTTCAACGAGAAAACACACGTCCAACTCAGTTTGCCTGTTTTACAGGTTCGCGACGTGCTCGTACGTGGCTTTGGAGACTCCGTGGAGGAGGTCTTATCAGAGGCACGTCAACATCTTAAAGATGGCACTTGTGGCTTAGTAGAAG');
    $("#spacer_length").val(30);
    $("#intervals").val(1);
    $("#F_primer").val('cacc');
    $("#R_primer").val('caac');
}
globalThis.clear_results = clear_results;
function clear_results() {
    $("#errors_div").css("display", 'none');
    $("#stats_div").css("display", 'none');
    $("#output_div").css("display", 'none');
    $("#extra_output_div").css("display", 'none');
    $("#outputs").removeClass("double");
    $('textarea#errors').val("");
    $('textarea#output').val("");
    $('textarea#extra_output').val("");
    $('textarea#stats').val("");
    setTimeout(function () {
        updateDisabledOptions();
    }, 50);
}
globalThis.getOptions = getOptions;
function getOptions() {
    var data = $("form").serializeArray()
        .reduce(function (result, val) {
        result[val.name] = val.value;
        return result;
    }, {});
    var options = {
        strands_shown: data.strands_shown,
        format: data.format,
        lines: data.lines,
        separator: data.separator
    };
    return options;
}
globalThis.submit_sequence = submit_sequence;
function submit_sequence() {
    clear_results();
    $("#output_div").css("display", 'block');
    var options = getOptions();
    var errors = [];
    // Calculate sequences
    var sequence = ("" + $("#fasta_sequence").val()).toUpperCase(), F_primer = ("" + $("#F_primer").val()).toLowerCase(), R_primer = ("" + $("#R_primer").val()).toLowerCase(), spacer_length = parseInt("" + $("#spacer_length").val()), intervals = parseInt("" + $("#intervals").val());
    var outputs = [];
    var forward_seq = [];
    var reverse_seq = [];
    var pos = 0;
    if ($("#spacer_length").val() === '')
        spacer_length = 30;
    if ($("#intervals").val() === '')
        intervals = 1;
    if ((!Number.isInteger(intervals) && $("#intervals").val() !== '') || intervals < 1 || parseInt("" + $("#intervals").val()) === 0) {
        var message = "Intervals must be an integer 1 or greater, setting 'intervals' to 1.";
        errors.push(message);
        intervals = 1;
    }
    if ((!Number.isInteger(spacer_length) && $("#spacer_length").val() !== '') || spacer_length < 1 || parseInt("" + $("#spacer_length").val()) === 0) {
        var message_1 = "Spacer Length must be an integer 1 or greater, setting 'spacer_length' to 1.";
        errors.push(message_1);
        spacer_length = 1;
    }
    if (seq.checkType(sequence, 1) == 'dna' || seq.checkType(sequence, 1) == 'rna') {
        // console.log("Sequence is fine, no errors.");
    }
    else {
        var message_2 = "Input sequence is not DNA or RNA";
        errors.push(message_2);
    }
    while (pos < sequence.length) {
        if (pos + spacer_length < sequence.length) {
            var match = sequence.slice(pos, pos + spacer_length);
            forward_seq.push("" + F_primer + seq.reverse(seq.complement(match)));
            reverse_seq.push("" + R_primer + match);
        }
        pos += intervals;
    }
    // Save sequences to #output for charting purposes
    d3.select("#output").datum({
        forward_seq: forward_seq,
        reverse_seq: reverse_seq
    });
    drawChart();
    // Apply options
    var separator = options.separator == "tabs" ? "\t" : " ";
    if (options.format == 'fasta') {
        forward_seq = forward_seq.map(function (d, i) { return ">gRNA_" + (i + 1) + "_F\n" + d.replace(/.{80}/g, "$0\n"); });
        reverse_seq = reverse_seq.map(function (d, i) { return ">gRNA_" + (i + 1) + "_R\n" + d.replace(/.{80}/g, "$0\n"); });
    }
    else {
        forward_seq = forward_seq.map(function (d, i) { return "gRNA_" + (i + 1) + "_F" + separator + d; });
        reverse_seq = reverse_seq.map(function (d, i) { return "gRNA_" + (i + 1) + "_R" + separator + d; });
    }
    if (options.lines == 'collate') {
        for (var i = 0; i < forward_seq.length; i++) {
            outputs.push(forward_seq[i]);
            outputs.push(reverse_seq[i]);
        }
    }
    else if (options.lines == 'separate') {
        outputs = forward_seq.concat(reverse_seq);
    }
    else if (options.lines == 'double') {
        for (var i = 0; i < forward_seq.length; i++) {
            outputs.push(forward_seq[i] + separator + reverse_seq[i]);
        }
    }
    // Print output
    if (options.strands_shown == 'forward') {
        $("#output").val(forward_seq.join("\n"));
    }
    else if (options.strands_shown == 'reverse') {
        $("#output").val(reverse_seq.join("\n"));
    }
    else {
        if (options.lines != 'files') {
            $("#output").val(outputs.join("\n"));
        }
        else {
            $("#output").val(forward_seq.join("\n"));
            $("#outputs").addClass("double");
            $("#extra_output_div").css("display", "block");
            $("#extra_output").val(reverse_seq.join("\n"));
        }
    }
    if (spacer_length > sequence.length) {
        errors.push("Warning, spacer length is longer than sequence length.");
    }
    // Print any errors
    if (errors.length > 0) {
        $("#errors_div").css("display", 'block');
        $("#errors").val(errors.join("\n"));
    }
    // Print stats
    var stats = [];
    stats.push("Sequence length: " + sequence.length);
    stats.push("GC content: " + countGCcontent(sequence) + "%");
    if (options.strands_shown == 'both') {
        stats.push("Number of guide RNAs created: " + (forward_seq.length + reverse_seq.length));
    }
    else if (options.strands_shown == 'forward') {
        stats.push("Number of guide RNAs created: " + forward_seq.length);
    }
    else if (options.strands_shown == 'reverse') {
        stats.push("Number of guide RNAs created: " + reverse_seq.length);
    }
    $("#stats_div").css("display", 'block');
    $("#stats").val(stats.join("\n"));
}
globalThis.update_data = update_data;
function update_data(link, data) {
    $(link).prop('href', "data:text/plain;charset=utf-8," + encodeURIComponent("" + $(data).val()));
}
globalThis.countGCcontent = countGCcontent;
function countGCcontent(sequence) {
    var total = sequence.length, gc = 0;
    sequence.split('').forEach(function (char) {
        if (char === 'c' || char === 'C' || char === 'g' || char === 'G')
            gc++;
    });
    return Math.floor((100 * gc) / total);
}
function updateDisabledOptions() {
    var options = getOptions();
    if (options.strands_shown == 'both') {
        $("input[name='lines']").prop('disabled', false);
        if (options.format == 'fasta') {
            $("#double_radio").prop('disabled', true);
            if ($("#double_radio").prop('checked')) {
                $("#collate_radio").prop('checked', true);
            }
        }
        else {
            $("#double_radio").prop('disabled', false);
        }
    }
    else {
        $("input[name='lines']").prop('disabled', true);
    }
    if (options.format == 'classic') {
        $("input[name='separator']").prop('disabled', false);
    }
    else {
        $("input[name='separator']").prop('disabled', true);
    }
}
if (window.location.hash == "#advanced") {
    $("#advancedOptions").removeClass("hidden");
}
function drawChart() {
    console.log("Drawing chart");
    var rawData = d3.select("#output").datum();
    var data = [];
    data = data.concat(rawData.forward_seq.map(function (d, i) {
        return {
            x: i,
            label: "gRNA_" + (i + 1) + "_F",
            seq: d,
            gc: countGCcontent(d),
            type: 'forward'
        };
    }));
    data = data.concat(rawData.reverse_seq.map(function (d, i) {
        return {
            x: i,
            label: "gRNA_" + (i + 1) + "_R",
            seq: d,
            gc: countGCcontent(d),
            type: 'reverse'
        };
    }));
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 40, left: 50 }, width = 900 - margin.left - margin.right, height = 600 - margin.top - margin.bottom;
    d3.select("#chart g").remove();
    // append the svg object to the body of the page
    var svg = d3.select("#chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // Add the grey background that makes ggplot2 famous
    svg
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("fill", "EBEBEB");
    // Add X axis
    var x = d3.scaleLinear()
        .domain([-10, 10 + rawData.forward_seq.length])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSize(-height * 1.3).ticks(10))
        .select(".domain").remove();
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0])
        .nice();
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(-width * 1.3).ticks(7))
        .select(".domain").remove();
    // Customization
    svg.selectAll(".tick line").attr("stroke", "white");
    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 20)
        .text("gRNA position");
    // Y axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top - height / 2 + 20)
        .text("GC content %");
    // Color scale: give me a specie name, I return a color
    var color = d3.scaleOrdinal()
        .domain(["forward", "reverse", "average"])
        .range(["#F8766D", "#00BA38", "#619CFF"]);
    var tooltip, background, closeButton, title, sequence, gcContent;
    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.x); })
        .attr("cy", function (d) { return y(d.gc); })
        .attr("r", 4)
        .style("opacity", 0.5)
        .style("fill", function (d) { return color(d.type); })
        .on("mouseover", function (d) {
        tooltip.style("display", "block");
        title.text(d.label);
        sequence.text(d.seq);
        gcContent.text("GC: " + d.gc + "%");
        var textWidth = sequence.node().getBBox().width;
        background.attr('width', textWidth + 20);
        closeButton.attr('x', textWidth + 5);
        var tooltipX = x(d.x) + 5;
        if (tooltipX + textWidth > width) {
            tooltipX = width - textWidth;
        }
        var tooltipY = y(d.gc) - 75;
        if (tooltipY < 0) {
            tooltipY = y(d.gc) + 5;
        }
        tooltip.attr("transform", "translate(" + tooltipX + ", " + tooltipY + ")");
    });
    // Add label
    tooltip = svg.append("g")
        .style("display", "none")
        .attrs({
        id: "chart-tooltip"
    });
    background = tooltip.append("rect")
        .attrs({
        width: '370px',
        height: '70px',
        fill: 'white',
        stroke: "black",
        rx: '5px'
    });
    closeButton = tooltip.append("text").text("X").attrs({
        x: 355,
        y: 18,
        'font-weight': 700
    }).style("cursor", "pointer")
        .on('click', function () { tooltip.style("display", "none"); });
    title = tooltip.append('text').text("title")
        .attrs({
        x: 10,
        y: 20
    });
    sequence = tooltip.append('text').text("sequence")
        .attrs({
        x: 10,
        y: 40
    });
    gcContent = tooltip.append('text').text("gc Content")
        .attrs({
        x: 10,
        y: 60
    });
}
$("#advancedOptions input").change(function () {
    updateDisabledOptions();
    if ($("#fasta_sequence").val() && $("#output").val())
        submit_sequence();
});
$(document).on("keypress", function (e) {
    // ESCAPE key pressed
    if (e.keyCode == 27) {
        d3.select("#chart-tooltip").style("display", "none");
    }
});
