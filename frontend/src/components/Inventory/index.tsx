import React, { useState } from 'react';
import * as S from './styles';

const tabs = [
	'GERAL',
	'CAMISETA',
	'JAQUETA',
	'CHAPEU',
	'CALÇA',
	'LUVA',
	'ÓCULOS',
	'ACESSÓRIO',
	'CALÇADOS',
	'COLETE',
	'PARAQUEDAS',
];

const inventoryItems = [
	{
		name: 'Camiseta',
		type: 'CAMISETA',
		image: 'https://via.placeholder.com/50',
	},
	{ name: 'Jaqueta', type: 'JAQUETA', image: 'https://via.placeholder.com/50' },
	{ name: 'Chapéu', type: 'CHAPEU', image: 'https://via.placeholder.com/50' },
	{ name: 'Calça', type: 'CALÇA', image: 'https://via.placeholder.com/50' },
	{ name: 'Luvas', type: 'LUVA', image: 'https://via.placeholder.com/50' },
	{
		name: 'Óculos',
		type: 'ÓCULOS',
		image: 'https://via.placeholder.com/50',
	},
];

export const Inventory = () => {
	const [activeTab, setActiveTab] = useState('GERAL');

	const handleTabClick = (tabName: string) => {
		setActiveTab(tabName);
	};

	return (
		<S.GroupSection>
			<S.ContentContainer>
				<h2>MEU INVENTÁRIO</h2>
				<S.TabsContainer>
					{tabs.map((tabName) => (
						<S.Tab
							key={tabName}
							onClick={() => handleTabClick(tabName)}
							$isActive={activeTab === tabName}
						>
							{tabName}
						</S.Tab>
					))}
				</S.TabsContainer>

				<S.InventoryGrid>
					{inventoryItems
						.filter((item) => activeTab === 'GERAL' || item.type === activeTab)
						.map((item, index) => (
							<S.InventorySlot key={index}>
								<S.ItemImage src={item.image} alt={item.name} />
								<S.ItemName>{item.name}</S.ItemName>
							</S.InventorySlot>
						))}
				</S.InventoryGrid>
			</S.ContentContainer>
		</S.GroupSection>
	);
};
