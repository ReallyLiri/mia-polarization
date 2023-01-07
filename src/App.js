import "./index.css"
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { uniq } from "lodash/array";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import uuid from "react-uuid";
import { isEmpty, last, toNumber } from "lodash";
import { useRect } from "react-use-rect";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: ${ ({ width }) => width ? `${ width }px` : '100%' };
  height: 98vh;
  border: 10px solid #228a8d;
  box-sizing: border-box;
  overflow: hidden;
`

const Markered = styled.div`
  text-align: center;
  padding: 4px;
  background-color: ${ ({ color }) => color };
  color: white;
  width: ${ ({ width }) => width }px;
  z-index: 1;
`

const Title = styled(Markered)`
  margin: 20px;
  font-size: 20px;
  align-self: center;
`

const Row = styled.div`
  margin: 2rem;
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 1rem;
  justify-content: start;
  align-items: start;
  flex-wrap: wrap;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
`

const CheckerColumn = styled(Column)`
  width: 200px;
`

const ExperimentsContainer = styled(Column)`
  position: absolute;
  top: 80px;
  left: 280px;
  overflow-x: hidden;
  overflow-y: auto;
  max-width: 1400px;
  height: 800px;
`

const ExperimentGif = styled.img`
  max-height: 20rem;
  width: auto;
  margin-left: -50px;
`

const VerticalDivider = styled.div`
  width: 5px;
  height: 800px;
  background-color: #440356;
  margin-right: 1rem;
`

const Arrow = styled.span`
  font-size: 32px;
  font-weight: bold;
  color: #1f988b;
  justify-self: center;
  align-self: center;
  z-index: 1;
`

const sortExperiments = (data) => data.sort((a, b) => a.eta - b.eta)

const loadCsv = (setSimRows, setRepRows) => {
  fetch('combined_experiments.csv')
    .then(response => {
      response.text().then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const sims = []
            const reps = []
            results.data.forEach(row => {
              const eta = row.radical_exposure_eta
              const data = {
                experimentId: row.experiment_id,
                eta: eta === "NULL" ? null : parseFloat(eta),
              }
              if ( row.simulation_type === "SIMILARITY" ) {
                sims.push(data)
              } else if ( row.simulation_type === "REPULSIVE" ) {
                reps.push(data)
              }
            })
            setSimRows(sortExperiments(sims))
            setRepRows(sortExperiments(reps))
          },
        });
      })
    })
}

const Experiment = ({ experimentId, eta, visible, isLast }) => {
  const title = eta === null ? 'Vanilla' : `η=${ eta }`;
  return visible && <>
    <div style={ { display: "flex", flexDirection: "column", alignItems: "center" } }>
      <ExperimentGif src={ `figures/${ experimentId }.gif` } alt={ experimentId }
                     title={ title }/>
      <div>{ title }</div>
    </div>
    {
      !isLast && <Arrow>→</Arrow>
    }
  </>;
}

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-left: 16px;
  margin-top: 8px;
  justify-content: start;
  gap: 8px;
`

const Checkbox = styled.input`
  accent-color: #440356;
`

const Button = styled.div`
  width: 60px;
  border-radius: 4px;
  background-color: #228a8d;
  color: white;
  padding: 4px;
  text-align: center;
  cursor: pointer;
`

const EtaCheckbox = ({ eta, checked, onCheck }) => <CheckboxRow>
  <Checkbox type="checkbox" checked={ checked } onChange={ onCheck } disabled={ eta === null }/>
  <div>{ eta || 'Vanilla' }</div>
</CheckboxRow>

const StyledDropdown = styled(Dropdown)`
  margin-top: 8px;
  margin-bottom: 32px;
`

const SIMILARITY = 'Similarity'
const REPULSIVE = 'Repulsive'

const LIMIT = 6

const showAlert = (message) => {
  alert(message)
}

const App = () => {

  const [simRows, setSimRows] = useState([])
  const [repRows, setRepRows] = useState([])
  const [etas, setEtas] = useState([])
  const [mode, setMode] = useState(SIMILARITY)
  const [width, setWidth] = useState()
  const ref = useRef()
  const [setRef] = useRect((rect) => {
    if ( ref.current ) {
      setWidth(ref.current.scrollWidth + 280)
    }
  }, { resize: true })

  const urlSearchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const selectedEtas = ( Object.fromEntries(urlSearchParams.entries())['etas']?.split(',') || [] )
    .map(e => e.toString())
    .filter(e => e)
    .sort((a,b) => toNumber(a) - toNumber(b));

  useEffect(() => {
    if ( ref.current ) {
      setRef(ref.current)
    }
  }, [setRef])

  const isVisible = useCallback((eta) => {
    return eta === null || selectedEtas.includes(eta.toString())
  }, [selectedEtas])

  useEffect(() => loadCsv(setSimRows, setRepRows), [])

  const setSelectedEtas = (selected) => {
    const url = new URL(window.location.href);
    url.searchParams.set('etas', selected.filter(e => e).join(','));
    if ( url.toString() !== window.location.href ) {
      window.location.assign(url);
    }
  }

  useEffect(() => {
    if (isEmpty(simRows)) {
      return
    }
    const allEtas = uniq(simRows.map(data => data.eta));
    setEtas(allEtas)
    if ( selectedEtas.length === 0 && !urlSearchParams.has("etas") ) {
      const defaultSetup = [allEtas[0], allEtas[1], allEtas[6], allEtas[11], allEtas[16], allEtas[18]]
      setSelectedEtas(defaultSetup)
    }
  }, [selectedEtas.length, simRows, urlSearchParams])

  return (
    <Container width={ width }>
      <Title color='#228a8d' width={ 160 }>Polarization</Title>
      <Row>
        <CheckerColumn>
          <div>Experiments set:</div>
          <StyledDropdown options={ [SIMILARITY, REPULSIVE] } onChange={ option => setMode(option.value) }
                          value={ mode } placeholder="Select an option"/>
          <Markered width={ 200 } color="#440356">Choose η values</Markered>
          <CheckboxRow>
            <Button title={ `First ${ LIMIT } options` }
                    onClick={ () => setSelectedEtas(etas.slice(0, LIMIT)) }>Default</Button>
            <Button title="None" onClick={ () => setSelectedEtas([]) }>None</Button>
          </CheckboxRow>
          {
            etas.map(eta => <EtaCheckbox key={ eta } eta={ eta }
                                         checked={ eta === null || selectedEtas.includes(eta?.toString()) } onCheck={
              () => {
                const next = selectedEtas.includes(eta.toString()) ? selectedEtas.filter(e => e !== eta.toString()) : [...selectedEtas, eta.toString()]
                if ( next.length > LIMIT - 1 ) {
                  showAlert(`Sorry, selection is limited to ${ LIMIT } values`)
                } else {
                  setSelectedEtas(next)
                }
              }
            }/>)
          }
        </CheckerColumn>
        <VerticalDivider/>
        <ExperimentsContainer ref={ ref }>
          <Row>
            {
              mode === SIMILARITY
                ? simRows.map(row => <Experiment key={ uuid() } visible={ isVisible(row.eta) }
                                                 isLast={ row.eta?.toString() === last(selectedEtas) } { ...row }/>)
                : repRows.map(row => <Experiment key={ uuid() } visible={ isVisible(row.eta) }
                                                 isLast={ row.eta?.toString() === last(selectedEtas) } { ...row }/>)
            }
          </Row>
        </ExperimentsContainer>
      </Row>
    </Container>
  );
};

export default App;
