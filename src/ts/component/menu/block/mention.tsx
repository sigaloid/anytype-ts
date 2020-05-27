import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, StructDecode, Util, DataUtil, Mark } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	pages: I.PageInfo[];
	loading: boolean;
	page: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 28;
const PAGE = 12;

@observer
class MenuBlockMention extends React.Component<Props, State> {

	_isMounted: boolean = false;	
	n: number = 0;
	filter: string = '';

	state = {
		pages: [],
		loading: false,
		page: 0,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { page } = this.state;
		const sections = this.getSections();

		let id = 0;

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (++id > (page + 1) * PAGE) {
							return null;
						};

						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onOver(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);

		return (
			<div className="items">
				{!sections.length ? <div className="item empty">No items match filter</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.loadSearch();
	};

	componentDidUpdate () {
		const { filter } = commonStore;

		if (this.filter != filter.text) {
			this.filter = filter.text;
			this.setState({ page: 0 });
		};

		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		node.find('.items').unbind('scroll.menu').on('scroll.menu', (e: any) => { this.onScroll(); });
	};
	
	unbind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.unbind('keydown.menu');
		node.find('.items').unbind('scroll.menu');
	};

	onScroll () {
		const { id } = this.props;
		const { page } = this.state;
		const menu = $('#' + Util.toCamelCase('menu-' + id));
		const content = menu.find('.content');
		const top = content.scrollTop();

		if (top >= page * PAGE * HEIGHT) {
			this.setState({ page: page + 1 });
		};
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { pages } = this.state;
		const { filter } = commonStore;

		let id = 1;
		let pageData = [];

		for (let page of pages) {
			if (page.id == rootId) {
				continue;
			};
			
			pageData.push({
				id: page.id, 
				name: page.details.name, 
				icon: page.details.iconEmoji,
				hash: page.details.iconImage,
				withSmile: true,
			});
		};

		let sections = [
			{ id: 'page', name: 'Mention a page', children: pageData },
		];

		if (filter && filter.text) {
			sections = DataUtil.menuSectionsFilter(sections, filter.text);
		};

		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.onScroll();
		window.setTimeout(() => {
			this.props.setActiveItem(items[this.n], scroll);
		});
	};

	loadSearch () {
		this.setState({ loading: true });
		let pages: any[] = [];

		C.NavigationListPages((message: any) => {
			pages = message.pages.map((it: any) => { return this.getPage(it); });
			this.setState({ pages: pages, loading: false });
		});
	};

	getPage (page: any): I.PageInfo {
		let details = StructDecode.decodeStruct(page.details || {});
		details.name = String(details.name || Constant.default.name || '');

		return {
			id: page.id,
			snippet: page.snippet,
			details: details,
			text: [ details.name, page.snippet ].join(' '),
		};
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();

		const k = e.which;
		keyboard.disableMouse(true);
		
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onClick(e, item);
				};
				break;
				
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { rootId, blockId, onChange } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		const { content } = block;
		content.marks = Mark.toggle(content.marks, { 
			type: I.MarkType.Mention, 
			param: item.key, 
			range: { from: filter.from, to: filter.from + item.name.length },
		});

		onChange(item.name + ' ', content.marks, filter.from);
		commonStore.menuClose(this.props.id);
	};
	
};

export default MenuBlockMention;