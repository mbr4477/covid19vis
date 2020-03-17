class CovidMapView {
    constructor(
        parentSelector, 
        width, 
        height
    ) {
        this.canvas = this.initCanvas(parentSelector, width, height);
        this.context = this.initContext(this.canvas, width, height);
        this.width = width;
        this.height = height;
        this.time = 0.0;
        this.rotation = [0,0,0]

        this.projection = d3.geoOrthographic()
            .scale(height * 0.4)
            .precision(0.1)
            .clipAngle(90)
            .translate([width / 2, height / 2]);

        this.barProjection = d3.geoOrthographic()
            .scale(height * 0.4)
            .precision(0.1)
            .clipAngle(90)
            .translate([width / 2, height / 2]);
    
        this.path = d3.geoPath()
            .projection(this.projection)
            .context(this.context);

        this.barPath = d3.geoPath()
            .projection(this.barProjection)
            .context(this.context);
    
        this.graticule = d3.geoGraticule()
    
        this.rotation_speed = 1e-2;
    }

    setTime(time) {
        this.time = time
    }
    setWorld(worldTopo) {
        this.worldTopo = worldTopo
    }
    setCovidData(covid) {
        this.covidData = covid
    }
    setRotation(rotation) {
        this.projection.rotate(rotation)
        this.barProjection.rotate(rotation)
        this.rotation = rotation
    }
    getRotation() {
        return this.rotation
    }

    initCanvas(parentSelector, width, height) {
        let canvas = d3.select(parentSelector)
            .append('canvas')
            .attr('width', width*2)
            .attr('height', height*2);
        canvas.node().style.width = width;
        canvas.node().style.height = height;
        return canvas
    }
    initContext(canvas, width, height) {
        let context = canvas.node().getContext('2d');
        context.scale(2,2);
        return context;
    }

    render() {
        this.context.fillStyle = '#fff'
        this.context.clearRect(0, 0, this.width, this.height);
        this.renderCovidData(true)
        this.renderMap()
        this.renderCovidData()
    }

    renderCovidData(isBgLayer = false) {
        let columns = this.covidData.columns.slice(4);
        let timeColumn = Math.round((columns.length-5) * this.time)
        for (let i = 0; i < this.covidData.length; i++) {
            let count = this.covidData[i][columns[timeColumn + 4]]
            let radius = Math.log(count) * 10
            radius = count * 0.05;
            this.barProjection.scale(height * 0.4 + radius)
            let start, end
            if (isBgLayer) {
                start = this.projection([ this.covidData[i]['Long'], this.covidData[i]['Lat'] ]);
                end = this.barProjection([ this.covidData[i]['Long'], this.covidData[i]['Lat'] ]);
            } else {
                let geoJs = { type: 'Point', coordinates: [ this.covidData[i]['Long'], this.covidData[i]['Lat'] ]}
                start = this.path.centroid(geoJs);
                end = this.barPath.centroid(geoJs);
            }
            this.context.beginPath()
            this.context.moveTo(start[0], start[1])
            this.context.lineTo(end[0], end[1])
            this.context.strokeStyle = '#ff5555'
            this.context.lineWidth = '4'
            this.context.stroke()
        }
    }

    renderMap() {
        this.context.beginPath();
        this.path({type: 'Sphere'});
        this.context.fillStyle = '#ccf2ff';
        this.context.fill();
        // context.strokeStyle = '#5555ff'
        // context.stroke();
    
        this.context.beginPath();
        this.path(this.graticule());
        this.context.lineWidth = '1';
        this.context.strokeStyle = '#99e6ff';
        this.context.stroke();
    
        this.context.beginPath();
        this.path(topojson.object(this.worldTopo, this.worldTopo.objects.countries));
        this.context.fillStyle = '#fff2e6';
        this.context.fill();
        this.context.lineWidth = '2';
        this.context.strokeStyle = '#ffd9b3';
        this.context.stroke();
    }
};