import React from 'react';
import Helmet from 'react-helmet';

const Title = ({title},{description}) => {
	var defaultTitle = '⚛️ app';
	var defaultDescription = '⚛️ description';
	var defaultCanonical = "";
	return(
		<Helmet>
			<meta charSet="utf-8" />
			<title>{ title ? title : defaultTitle}</title>
	        <link rel="canonical" href="" />
	        <meta name="description" content={description ? description: defaultDescription} />
	        <meta name="robots" content="noindex, nofollow" />
		</Helmet>
		);
};

export default Title;