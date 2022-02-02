import * as React from 'react';
import { I, DataUtil, translate } from 'ts/lib';

interface Props {
	object: any;
	className?: string;
};

class Name extends React.Component<Props, {}> {

	public static defaultProps = {
		className: 'name',
	};

	render () {
		const { object, className } = this.props;
		const { layout, snippet, type } = object;

		let name = '';
		if (DataUtil.isFileType(type)) {
			name = DataUtil.fileName(object);
		} else
		if (layout == I.ObjectLayout.Note) {
			name = snippet || <span className="empty">{translate('commonEmpty')}</span>;
		} else {
			name = object.name || DataUtil.defaultName('page');
		};
		
		return (
			<div className={className}>
				<span>{name}</span>
			</div>
		);
	};
	
};

export default Name;