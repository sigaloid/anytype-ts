import * as React from 'react';
import { I } from 'ts/lib';
import { ObjectPreviewBlock } from 'ts/component';

interface Props extends I.Menu {};

class MenuPreviewObject extends React.Component<Props, {}> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		return (
			<ObjectPreviewBlock rootId={rootId} />
		);
	};

};

export default MenuPreviewObject;
