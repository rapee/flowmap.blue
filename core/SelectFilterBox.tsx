import {Classes, Intent, MenuItem} from '@blueprintjs/core';
import {ItemPredicate, ItemRenderer} from '@blueprintjs/select';
import {nest} from 'd3-collection';
import React from 'react';
import {defaultMemoize} from 'reselect';
import {matchesSearchQuery} from './matchesSearchQuery';
import Dropdown from './Dropdown';
// import {Location} from './types';
import styled from '@emotion/styled';
// import {Cluster} from '@flowmap.gl/cluster';
// import {LocationFilterMode} from './FlowMap.state';

export interface Props {
  key: string;
  placeholder: string | undefined;
  selectedChoices: string[] | undefined;
  choices: string[];
  // locationFilterMode: LocationFilterMode;
  onSelectionChanged: (selectedChoices: string[] | undefined) => void;
  // onLocationFilterModeChange: (mode: LocationFilterMode) => void;
}

const ChoiceTag = styled.div({
  display: 'flex',
  fontSize: 10,
  alignItems: 'center',
  '& > * + *': {
    marginLeft: 5,
  },
});

const itemPredicate: ItemPredicate<string> = (query, choice) => {
  // const {id, name} = choice;
  return matchesSearchQuery(query, `${choice}`);
  // return matchesSearchQuery(query, `${id} ${name}`);
};

function sortChoices(choices: string[]): string[] {
  return choices.slice();
  // return choices.slice().sort()
  // return choices.slice().sort((a, b) => {
  //   const aname = a.name || a.id;
  //   const bname = b.name || b.id;
  //   if (aname < bname) return -1;
  //   if (aname > bname) return 1;
  //   return 0;
  // });
}

function getSelectedChoicesSet(selectedChoices: string[] | undefined) {
  if (!selectedChoices || selectedChoices.length === 0) {
    return undefined;
  }
  return new Set(selectedChoices);
}

interface ChoicesBySelectionStatus {
  selected: string[] | undefined;
  unselected: string[];
}

function getChoicesBySelectionStatus(
  choices: string[],
  selectedChoices: string[] | undefined,
): ChoicesBySelectionStatus {
  const selectedIds = getSelectedChoicesSet(selectedChoices);
  if (!selectedIds) {
    return {
      selected: undefined,
      unselected: choices,
    };
  }

  const {selected, unselected} = nest<string, ChoicesBySelectionStatus>()
    .key((choice) => (selectedIds.has(choice) ? 'selected' : 'unselected'))
    .object(choices);

  return {
    selected,
    unselected,
  };
}

const Outer = styled.div`
  & > * > .${Classes.POPOVER_TARGET} {
    max-width: 15rem;
  }
  .${Classes.TAG_INPUT} {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  .${Classes.TAG_INPUT_VALUES} {
    max-height: 150px;
    overflow-y: auto;
    align-items: flex-start;
  }
  .${Classes.HTML_SELECT} {
    & > select {
      font-size: small;
    }
  }
`;

const TextOverflowEllipsis = styled.span({
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  maxWidth: 180,
});

class SelectFilterBox extends React.PureComponent<Props> {
  private getSortedChoices = defaultMemoize(sortChoices);
  private getChoicesBySelectionStatus = defaultMemoize(getChoicesBySelectionStatus);

  render() {
    // const {choices, selectedChoices, locationFilterMode, onLocationFilterModeChange} =
    const {choices, selectedChoices, placeholder} =
      this.props;
    const {selected, unselected} = this.getChoicesBySelectionStatus(
      this.getSortedChoices(choices),
      selectedChoices,
    );
    return (
      <Outer>
        <Dropdown<string>
          placeholder={placeholder || "Choose values"}
          items={unselected}
          selectedItems={selected}
          maxItems={100}
          itemPredicate={itemPredicate}
          itemRenderer={this.itemRenderer}
          tagRenderer={this.tagRenderer}
          onCleared={this.handleSelectionCleared}
          onRemoved={this.handleChoiceRemoved}
          onSelected={this.handleChoiceSelected}
          // locationFilterMode={locationFilterMode}
          // onLocationFilterModeChange={onLocationFilterModeChange}
        />
      </Outer>
    );
  }

  private tagRenderer = (choice: string) => {
    const {selectedChoices} = this.props;
    const selection = selectedChoices && selectedChoices.find((val) => val === choice);
    if (!selection) {
      return null;
    }
    return (
      <ChoiceTag>
        <TextOverflowEllipsis>{choice}</TextOverflowEllipsis>
      </ChoiceTag>
    );
  };

  private itemRenderer: ItemRenderer<string> = (item, {handleClick, modifiers}) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    // const {id, name} = item as string;
    const id = item as string;
    const name = item as string;
    const {selectedChoices} = this.props;
    const isSelected = selectedChoices && selectedChoices.indexOf(id) >= 0;
    const intent = isSelected ? Intent.PRIMARY : Intent.NONE;
    return (
      <MenuItem
        key={id}
        active={modifiers.active}
        text={name}
        intent={intent}
        onClick={handleClick}
      />
    );
  };

  private handleSelectionCleared = () => this.props.onSelectionChanged(undefined);

  private handleChoiceSelected = (choice: string) => {
    const {selectedChoices, onSelectionChanged} = this.props;
    // const {id} = location;
    if (selectedChoices) {
      if (selectedChoices.indexOf(choice) < 0) {
        onSelectionChanged([...selectedChoices, choice]);
      }
    } else {
      onSelectionChanged([choice]);
    }
  };

  private handleChoiceRemoved = (choice: string) => {
    const {selectedChoices, onSelectionChanged} = this.props;
    if (selectedChoices) {
      // const {id} = location;
      const idx = selectedChoices.indexOf(choice);
      if (idx >= 0) {
        const next = selectedChoices.slice();
        next.splice(idx, 1);
        onSelectionChanged(selectedChoices.length === 1 ? undefined : next);
      }
    }
  };
}

export default SelectFilterBox;
