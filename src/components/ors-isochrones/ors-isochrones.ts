import "@vaadin/icon";
import "@vaadin/icons";
import "@vaadin/tabs";
import "@vaadin/tabsheet";
import "@vaadin/text-field";
// import noUiSlider from 'nouislider';
// import 'nouislider/distribute/nouislider.css';
import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

const generateIsochroneColor = (index: number): string => {
  const colors = ["#2ba83b", "#64abb0", "#9dd3a7", "#c7e9ad", "#edf8b9", "#ffedaa", "#fec980", "#f99e59", "#e85b3a", "#d7191c"];
  return colors[index % colors.length];
};
@customElement("ors-isochrones") 
export class OrsIsochrones extends LitElement {
  @property({ type: Number }) latitude = 22.50005;
  @property({ type: Number }) longitude = 51.236020;
  @property({ type: Number }) range = 15000; 
  @property({ type: Number }) interval = 3000;

  firstUpdated(props: any) {
    super.firstUpdated(props);
    // this.initializeRangeSlider();

  }
  //---------------------------------issue: noUIslider cant find css?, commenting all.
  // initializeRangeSlider() { 
  //   const rangeSlider = this.shadowRoot?.getElementById('rangeSlider') as HTMLElement;

  //   if (rangeSlider) {
  //     noUiSlider.create(rangeSlider, {
  //       start: [this.range],
  //       range: {
  //         'min': 2,
  //         'max': 15
  //       },
  //     });
  //     rangeSlider.noUiSlider.on('update', (values, handle) => {
  //       this.range = parseInt(values[handle]);
  //     });
  //   }
  // }

  render() {
    return html
    `
      <ors-search
        id=${"searchRouteStart"}
        .searchTerm=${""}
        .type=${"start"}
        .label=${"Wpisz adres:"}
      ></ors-search>

      <div>
        ${this.renderTextField("Latitude", this.latitude, (e) => (this.latitude = this.parseFloatInput(e)))}
        ${this.renderTextField("Longitude", this.longitude, (e) => (this.longitude = this.parseFloatInput(e)))}
        ${this.renderTextField("Range (meters)", this.range, (e) => (this.range = this.parseIntInput(e)))}
        ${this.renderTextField("Interval (meters)", this.interval, (e) => (this.interval = this.parseIntInput(e)))}

        <div id="rangeSlider"></div>
        <vaadin-button @click="${this.isochronesCalculation}">Submit</vaadin-button>
      </div>
    `;
  }
  renderTextField(label: string, value: number, inputHandler: (e: InputEvent) => void) {
    return html`
      <vaadin-text-field
        label="${label}"
        .value="${value}"
        @input="${inputHandler}"
      ></vaadin-text-field>
    `;
  }

  parseFloatInput(e: InputEvent): number {
    return parseFloat((e.target as HTMLInputElement).value);
  }

  parseIntInput(e: InputEvent): number {
    return parseInt((e.target as HTMLInputElement).value, 10);
  }

  async isochronesCalculation() {
    const apiKey = '5b3ce3597851110001cf6248aa1a772345b24cd994f979801d4ead01';
    const apiUrl = 'https://api.openrouteservice.org/v2/isochrones/driving-car';


    const minRange = 2000;
    const maxRange = 15000;
    const minInterval = 1000;
    const maxInterval = 10000;
// makes sure that range is not above max or below min, same for interval
const range = Math.min(Math.max(this.range, minRange), maxRange);
const interval = Math.min(Math.max(this.interval, minInterval), maxInterval);

    const defaultSettings = {
      profile: 'driving-car',
      range_type: 'distance',
      range: [range],
      interval: interval,
    };

  const requestOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        locations: [[this.latitude, this.longitude]],
        ...defaultSettings,
    }),
};

try { 
  const response = await fetch(`${apiUrl}?api_key=${apiKey}`, requestOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const isochroneCoordinates = data.features[0].geometry.coordinates

  const isochrones = isochroneCoordinates.map((coords: any, index: number) => {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
      properties: {
        color: generateIsochroneColor(index),
      },
    };
  });

  this.dispatchEvent(
    new CustomEvent('isochrones-calculated', {
      bubbles: true,
      composed: true,
      detail: { isochrones },
    })
  );
} catch (error) {
  console.error('Error: cant fetch isochrones:', error);
}

}


  static styles? = css`
    :host {
      height: 100%;
    }
    vaadin-text-field {
      width: 100%;
    }
  `;
}
