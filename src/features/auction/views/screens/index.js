import { home, help } from './home';
import { options, confirmReset, ceiling } from './options';
import { collection, collectionDetail } from './collection';
import { ledger, review } from './review';
import { workshop, business } from './workshop';
import { bidding } from './bidding';
import { briefing } from './briefing';
import { observe } from './observe';
import { settlement, repayment } from './results';
import { reveal } from './reveal';
import { passed } from './passed';

export const menuRoutes = {
  home, help, tutorial: help, pause: options, confirm: confirmReset, ceiling,
  collection, collectionDetail, ledger, review, shop: workshop, business,
};

export const gameRoutes = { briefing, observe, auction: bidding, reveal, settlement, repayment, passed };
