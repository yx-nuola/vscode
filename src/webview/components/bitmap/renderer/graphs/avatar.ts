// import Konva from 'konva';
// import * as Types from '../types';
// import * as Graphs from '../graphs';
// import { flatten, isEmpty, isEqual } from 'lodash-es';

// interface Option {
//   lineWidth: number;
//   margin: number; // 文字和刻度线之间的间距
// }

// interface State {
//   yscale: null | Types.ScaleLinear<number, number, never>;
// }

// type Theme = Types.Theme['dark'] | Types.Theme['light'];

// export class Avatar extends Konva.Group {
//   private readonly option: Option = {
//     margin: 2,
//     lineWidth: 10,
//   };
//   private text!: Konva.Text;
//   private tooltip!: Konva.Label;
//   private lockTooltip!: Konva.Label;
//   readonly property: Types.Property;
//   readonly theme: Theme;

//   private readonly state: State = {
//     yscale: null,
//   };

//   constructor(property: Types.Property) {
//     super(property); // 调用父类 Konva.Group 的构造函数
//     this.property = property;
//     this.theme = property.theme;
//     this.state.yscale = this.property.yscale as Types.ScaleLinear<number, number, never>;

//     // 选中标识
//     this.add(
//       new Konva.Path({
//         id: `${this.property.signal.signalName}-marker`,
//         x: 0,
//         y: 0,
//         data: `M0, 0, 4, 6, 4, ${this.property.height - 6}, 0, ${this.property.height}z`,
//         fill: '#0070c0',
//         visible: property.active,
//       })
//     );

//     this.text = new Graphs.Truncate({
//       id: `${this.property.signal.signalName}-text`,
//       x: 10,
//       text: this.property.signal.signalName,
//       height: this.property.height,
//       // fontStyles: 'bold',
//       fill: property.active ? '#0070c0' : this.theme.body.color,
//       fontSize: 10,
//       verticalAlign: 'middle',
//       maxWidth: 100,
//       wrap: 'none',
//     });

//     this.text.on('mouseover', (e) => {
//       document.body.style.cursor = 'pointer';
//       const element = e.target;
//       if (element instanceof Graphs.Truncate) {
//         this.mouseover(element);
//       }
//       e.evt.preventDefault();
//     });

//     this.text.on('mouseleave', (e) => {
//       document.body.style.cursor = 'default';
//       this.mouseleave();
//       e.evt.preventDefault();
//     });

//     this.add(this.text);

//     this.tooltip = new Konva.Label({
//       x: this.text.x() + this.text.width() + 8,
//       y: this.property.height / 2,
//       opacity: 1,
//       visible: false,
//     });

//     this.tooltip.add(
//       new Konva.Tag({
//         fill: '#000000',
//         pointerDirection: 'left',
//         pointerWidth: 6,
//         pointerHeight: 6,
//         lineJoin: 'round',
//       })
//     );

//     this.tooltip.add(
//       new Konva.Text({
//         text: this.property.signal.signalName,
//         fontSize: 10,
//         padding: 4,
//         fill: this.theme.body.color,
//       })
//     );

//     this.add(this.tooltip);

//     this.add(
//       new Konva.Line({
//         points: [this.property.width, 0, this.property.width, this.property.height],
//         stroke: this.theme.border,
//         strokeWidth: 0.5,
//         listening: false,
//       })
//     );

//     this.permanent();
//   }

//   private permanent() {
//     const { vll, vlh } = this.property.signal;

//     const x1 = this.property.width - this.option.lineWidth;
//     const x2 = this.property.width;
//     const domain = [vll, vlh];
//     for (let i = 0; i < domain.length; i++) {
//       const vh = domain[i];
//       this.add(
//         new Konva.Line({
//           id: `tick-mark-${vh}`,
//           points: flatten([
//             [x1, this.state.yscale && this.state.yscale(vh)],
//             [x2, this.state.yscale && this.state.yscale(vh)],
//           ]) as number[],
//           stroke: this.theme.border,
//           strokeWidth: 1,
//           visible: !this.property.delta?.yAxis,
//         })
//       );

//       const text = new Konva.Text({
//         id: `tick-text-${vh}`,
//         text: vh.toFixed(2),
//         fill: this.theme.body.color,
//         fontSize: 10,
//         visible: !this.property.delta?.yAxis,
//       });
//       text.x(x1 - text.width() - this.option.margin);
//       text.y(this.state.yscale && this.state.yscale(vh) - text.height() / 2);
//       this.add(text);
//     }
//   }

//   private mouseover(element: Konva.Node) {
//     const parent = element.parent;
//     if (parent instanceof Graphs.Avatar) {
//       const children = parent.getChildren();
//       const tooltip = children.find((node: Konva.Node) => node instanceof Konva.Label);

//       if (tooltip) {
//         this.lockTooltip = tooltip;
//         tooltip.visible(true);
//         tooltip.getLayer()?.batchDraw();
//       }
//     }
//   }

//   private mouseleave() {
//     if (isEmpty(this.lockTooltip)) return;

//     if (isEqual(this.lockTooltip, this.tooltip)) {
//       this.tooltip.visible(false);
//       this.tooltip.getLayer()?.batchDraw();
//     }
//   }
// }